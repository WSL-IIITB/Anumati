# share_resource
# share_resource_reverse
# revoke
# confer_resource
# confer_resource_reverse
# collateral_resource
# collateral_resource_reverse
# reshare_Xnode_Check

import json
from http import HTTPStatus
from django.http import JsonResponse,HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from . import utils
from ..models import Locker, CustomUser, Connection, Resource, Notification, ConnectionType, ConnectionTerms
from ..model.xnode_model import Xnode_V2
from .utils import NodeLockChecker  # Import NodeLockChecker
from .resource_management_view import access_Resource, delete_descendants


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def collateral_resource(request: HttpRequest) -> JsonResponse:
    """
    Expected JSON data (form data):
    connection_name,
    host_locker_name,
    guest_locker_name,
    host_user_username,
    guest_user_username,
    validity_until
    """
    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")
            validity_until = body.get("validity_until")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                validity_until,
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        # # Debug: Print the connection.terms_value and connection.resources for inspection
        # print("----------------------------------------------------")
        # print("terms_value:", connection.terms_value)
        # print("resources:", connection.resources)

        # if connection.connection_type.post_conditions["collateral"] == False:
        #     return JsonResponse({"success": False, "error": "Collateral not allowed in this connection"}, status=400)
        
        # Helper function to process sharable entries
        def do_collateral(key, value):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Checking key: {key}, value: {value}")  # Debugging output

            # Check if the term is a file entry based on the expected structure
            # if (
            #     "|" in value
            #     and "(" in value
            #     and ")" in value
            #     and (value.endswith(";T") or value.endswith("; T"))
            # ):
            #     print(f"File detected: {key} - {value}")  # File entry detected
            #     try:
            #         # Safely extract xnode_id and page range details
            #         print("Inside try block")
            #         parts_T = (
            #             value.split("; T")[0]
            #             if "; T" in value
            #             else value.split(";T")[0]
            #         )
            #         xnode_info = parts_T.split("|")[1].split(",")[0].strip()

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")  # Split by '|'

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]  # Extract document name and xnode_id
                        xnode_info = xnode_id.strip()  # Ensure xnode_id is clean
                        print(f"Document: {document_name}, Xnode ID: {xnode_info}")  # Debugging output

                    # Getting the original Inode
                    xnode = Xnode_V2.objects.get(id=xnode_info)
                    print("--------------------------------")
                    new_entry = {
                        "connection": connection.connection_id,
                        "from_locker": guest_locker.locker_id,
                        "to_locker": host_locker.locker_id,
                        "from_user": guest_user.user_id,
                        "to_user": host_user.user_id,
                        "type_of_share": "Collateral",
                        "xnode_id": 0,
                        "xnode_post_conditions": xnode.post_conditions,
                        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                        "reverse": False
                    }

                    print("new_entry:", new_entry)

                    if not isinstance(xnode.provenance_stack, list):
                        xnode.provenance_stack = []
                    print("++++++++++++++++++++++++++++++++")

                    xnode.provenance_stack.insert(0, new_entry)
                    xnode.save(update_fields=["provenance_stack"])   
                    # utils.append_xnode_provenance(
                    #     xnode_instance = xnode,
                    #     connection_id=connection.connection_id,
                    #     from_locker = guest_locker,
                    #     to_locker = host_locker,
                    #     from_user = guest_user,
                    #     to_user = host_user,
                    #     type_of_share = "Collateral",
                    #     xnode_post_conditions = xnode.post_conditions,
                    #     reverse = False
                    # )
                    
                    xnode.locker = host_locker
                    xnode.connection = connection
                    xnode.node_information["current_owner"] = host_user.user_id

                    # Copy and modify post_conditions and creator_conditions
                    post_conditions = {**xnode.post_conditions}
                    creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                    for key in ["subset"]:
                        post_conditions[key] = False
                        creator_conditions[key] = False

                    post_conditions["creator_conditions"] = creator_conditions
                    # if xnode.post_conditions["collateral"] == True:
                    #     if xnode.node_information["current_owner"] == xnode.node_information["primary_owner"]:
                    #         xnode.locker = host_locker
                    #         xnode.connection = connection
                    #         xnode.node_information["current_owner"] = host_user.user_id

                    xnode_created_Snode = Xnode_V2.objects.create(
                        creator=host_user.user_id,
                        locker=guest_locker,
                        connection=connection,
                        created_at=timezone.now(),
                        post_conditions=post_conditions,
                        validity_until=utils.get_defalut_validity(),
                        xnode_Type=Xnode_V2.XnodeType.SNODE,
                    )
                    xnode_created_Snode.node_information={
                            "inode_or_snode_id": xnode.id,
                            "resource_id": xnode.node_information["resource_id"],
                            "reverse": False,
                            "primary_owner": host_user.user_id,
                            "current_owner": guest_user.user_id,
                        }
                    xnode_created_Snode.save()
                    xnode.snode_list.insert(0, xnode_created_Snode.id)
                    # xnode.provenance_stack.insert(0, {"locker": guest_locker.locker_id, "connection": connection.connection_id, "user": guest_user.user_id})
                    xnode.save()

                    # Set is_locked on SNODE based on INODE's post_conditions
                    post_conditions = xnode.post_conditions or {}
                    is_locked = {}

                    for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        is_locked[key] = not post_conditions.get(key, False)

                    xnode_created_Snode.is_locked = is_locked
                    xnode_created_Snode.save(update_fields=["is_locked"])
                    print(f"Updated is_locked for SNODE {xnode_created_Snode.id}: {is_locked}")
                    xnode.provenance_stack[0]["xnode_id"] = xnode_created_Snode.id
                    xnode.save(update_fields=["provenance_stack"])
                    print(f"updated provenance stack of xnode:{xnode.provenance_stack[0]['xnode_id']}")
                    return True
                    #     else:
                    #         return JsonResponse({"error": f"Primary and Current owner are not same"}, status=400)
                    # else:
                    #     return JsonResponse({"error": f"This Xnode does not allow collateral"}, status=400)
                except Exception as e:
                    return JsonResponse({"error": f"Error processing entry {key}: {e}"}, status=400)
            return False
        
        # Start processing all entries
        collateral_success = False
        terms = connection.terms_value or {}
        resources = connection.resources.get("Collateral", [])

        # Top-level terms
        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            resource_name_in_value = value.split("|")[0].strip()
            status = value.split(";")[1].strip()
            for resource in resources:
                collateral_resource = resource.split("|")[0].strip()
                if collateral_resource == resource_name_in_value and status == "T":
                    result = do_collateral(key, value)
                    if isinstance(result, JsonResponse):
                        return result  # error returned
                    if result is True:
                        collateral_success = True

        # Nested entries: canShareMoreData
        can_share_more_data = connection.terms_value.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                resource_name_in_value = sharing_value.split("|")[0].strip()
                status = sharing_value.split(";")[1].strip()
                for resource in resources:
                    collateral_resource = resource.split("|")[0].strip()
                    if collateral_resource == resource_name_in_value and status == "T":
                        result = do_collateral(nested_key, sharing_value)
                        if isinstance(result, JsonResponse):
                            return result  # error returned
                        if result is True:
                            collateral_success = True

        # Final response
        if collateral_success:
            return JsonResponse({"success": True, "message": "Eligible resources pledged successfully"}, status=200)
        else:
            return JsonResponse({"success": False, "error": "No eligible file resource found for pledging"}, status=400)


        # for key, value in connection.terms_value.items():
        #     resource_name_in_value = value.split("|")[0].strip()
        #     resource_list_from_connection = connection.resources.get("Collateral", [])
        #     status = value.split(";")[1].strip()
        #     for resource in resource_list_from_connection:
        #         collateral_resource = resource.split("|")[0].strip()
        #         if collateral_resource == resource_name_in_value and status == "T":
        #             if do_collateral(
        #                 key, value
        #             ):
        #                 return JsonResponse(
        #                     {"success": True, "message": "Resource Pledged successfully"},
        #                     status=200,
        #                 )
        
        # # Process entries within "canShareMoreData" if present
        # can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        # for nested_key, nested_value in can_share_more_data.items():
        #     sharing_value = nested_value.get("enter_value")
        #     if sharing_value:
        #         if do_collateral(
        #             nested_key,
        #             sharing_value
        #         ):
        #             return JsonResponse(
        #                 {"success": True, "message": "Resource Pledged successful."},
        #                 status=200,
        #             )
                    
        # return JsonResponse({"success": False, "error": "No eligible file resource found for sharing"}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def collateral_resource_reverse(request: HttpRequest) -> JsonResponse:
    """
    Expected JSON data (form data):
    connection_name,
    host_locker_name,
    guest_locker_name,
    host_user_username,
    guest_user_username,
    validity_until
    """
    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")
            validity_until = body.get("validity_until")

            # Check if all required fields are present
            if not all(
                [
                    connection_name,
                    host_locker_name,
                    guest_locker_name,
                    host_user_username,
                    guest_user_username,
                    validity_until,
                ]
            ):
                return JsonResponse(
                    {"success": False, "error": "All fields are required"}, status=400
                )

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )

        except (
            Connection.DoesNotExist,
            Locker.DoesNotExist,
            CustomUser.DoesNotExist,
        ) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON format"}, status=400
            )

        # Debug: Print the connection.terms_value and connection.resources for inspection
        print("terms_value:", connection.terms_value_reverse)
        print("resources:", connection.resources)

        # if connection.connection_type.post_conditions["collateral"] == False:
        #     return JsonResponse({"success": False, "error": "Collateral not allowed in this connection"}, status=400)
        
        # Helper function to process sharable entries
        def do_collateral_reverse(key, value):
            # if (
            #     "|" in value
            #     and "(" in value
            #     and ")" in value
            #     and (value.endswith(";T") or value.endswith("; T"))
            # ):
            #     try:
            #         parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
            #         xnode_info = parts_T.split("|")[1].split(",")[0].strip()

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")  # Split by '|'

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]  # Extract document name and xnode_id
                        xnode_info = xnode_id.strip()  # Ensure xnode_id is clean
                        print(f"Document: {document_name}, Xnode ID: {xnode_info}")  # Debugging output


                    # from_to_str = parts_T.split("|")[1].split(",")[1].strip()
                    # from_page = int(from_to_str.split(":")[0].replace("(", "").strip())
                    # to_page = int(from_to_str.split(":")[1].replace(")", "").strip())

                    xnode = Xnode_V2.objects.get(id=xnode_info)
                    print("--------------------------------")
                    new_entry = {
                        "connection": connection.connection_id,
                        "from_locker": host_locker.locker_id,
                        "to_locker": guest_locker.locker_id,
                        "from_user": host_user.user_id,
                        "to_user": guest_user.user_id,
                        "type_of_share": "Collateral",
                        "xnode_id": xnode.id,
                        "xnode_post_conditions": xnode.post_conditions,
                        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                        "reverse": True
                    }

                    print("new_entry:", new_entry)

                    if not isinstance(xnode.provenance_stack, list):
                        xnode.provenance_stack = []
                    print("++++++++++++++++++++++++++++++++")

                    xnode.provenance_stack.insert(0, new_entry)
                    xnode.save(update_fields=["provenance_stack"])   
                    # utils.append_xnode_provenance(
                    #     xnode_instance = xnode,
                    #     connection_id=connection.connection_id,
                    #     from_locker = host_locker,
                    #     to_locker = guest_locker,
                    #     from_user = host_user,
                    #     to_user = guest_user,
                    #     type_of_share = "Collateral",
                    #     xnode_post_conditions = xnode.post_conditions,
                    #     reverse = True
                    # )
               
                    # if xnode.post_conditions["collateral"] == True:
                    #     if xnode.node_information["current_owner"] == xnode.node_information["primary_owner"]:
                    xnode.locker = guest_locker
                    xnode.connection = connection
                    xnode.node_information["current_owner"] = guest_user.user_id


                    # Copy and modify post_conditions and creator_conditions
                    post_conditions = {**xnode.post_conditions}
                    creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                    for key in ["subset"]:
                        post_conditions[key] = False
                        creator_conditions[key] = False

                    post_conditions["creator_conditions"] = creator_conditions

                    xnode_created_Snode = Xnode_V2.objects.create(
                        creator= guest_user.user_id,
                        locker=host_locker,
                        connection=connection,
                        created_at=timezone.now(),
                        post_conditions=post_conditions,
                        validity_until=utils.get_defalut_validity(),
                        xnode_Type=Xnode_V2.XnodeType.SNODE,
                    )
                    xnode_created_Snode.node_information={
                            "inode_or_snode_id": xnode.id,
                            "resource_id": xnode.node_information["resource_id"],
                            "reverse": True,
                            "method_name":{},
                            "method_params":{},
                            "primary_owner": guest_user.user_id,
                            "current_owner": host_user.user_id,
                        }
                    xnode_created_Snode.save()
                    xnode.snode_list.insert(0, xnode_created_Snode.id)
                    # xnode.provenance_stack.insert(0, {"locker": host_locker.locker_id, "connection": connection.connection_id, "user": host_user.user_id})
                    xnode.save()

                    # Set is_locked on SNODE based on INODE's post_conditions
                    post_conditions = xnode.post_conditions or {}
                    is_locked = {}

                    for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        is_locked[key] = not post_conditions.get(key, False)

                    xnode_created_Snode.is_locked = is_locked
                    xnode_created_Snode.save(update_fields=["is_locked"])
                    print(f"Updated is_locked for SNODE {xnode_created_Snode.id}: {is_locked}")
                    xnode.provenance_stack[0]["xnode_id"] = xnode_created_Snode.id
                    xnode.save(update_fields=["provenance_stack"])
                    print(f"updated provenance stack of xnode:{xnode.provenance_stack[0]['xnode_id']}")

                    return True
                    #     else:
                    #         return JsonResponse({"error": f"Primary and Current owner are not same"}, status=400)
                    # else:
                    #     return JsonResponse({"error": f"This Xnode does not allow collateral"}, status=400)
                except Exception as e:
                    return JsonResponse({"error": f"Error processing entry {key}: {e}"}, status=400)
            return False
        
        # Start processing all entries
        collateral_success = False
        terms = connection.terms_value_reverse or {}
        resources = connection.resources.get("Collateral", [])

        # Top-level terms
        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            resource_name_in_value = value.split("|")[0].strip()
            status = value.split(";")[1].strip()
            for resource in resources:
                collateral_resource = resource.split("|")[0].strip()
                if collateral_resource == resource_name_in_value and status == "T":
                    result = do_collateral_reverse(key, value)
                    if isinstance(result, JsonResponse):
                        return result  # error returned
                    if result is True:
                        collateral_success = True

        # Nested entries: canShareMoreData
        can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                resource_name_in_value = sharing_value.split("|")[0].strip()
                status = sharing_value.split(";")[1].strip()
                for resource in resources:
                    collateral_resource = resource.split("|")[0].strip()
                    if collateral_resource == resource_name_in_value and status == "T":
                        result = do_collateral_reverse(nested_key, sharing_value)
                        if isinstance(result, JsonResponse):
                            return result  # error returned
                        if result is True:
                            collateral_success = True

        # Final response
        if collateral_success:
            return JsonResponse({"success": True, "message": "Eligible resources pledged successfully"}, status=200)
        else:
            return JsonResponse({"success": False, "error": "No eligible file resource found for pledging"}, status=400)



        # # Process top-level terms in connection.terms_value
        # for key, value in connection.terms_value_reverse.items():
        #     print(f"terms value reverse: key = {key}, value = {value}")
        #     resource_name_in_value = value.split("|")[0].strip()
        #     resource_list_from_connection = connection.resources.get("Collateral", [])
        #     status = value.split(";")[1].strip()
        #     for resource in resource_list_from_connection:
        #         collateral_resource = resource.split("|")[0].strip()
        #         if collateral_resource == resource_name_in_value and status == "T":
        #             if do_collateral_reverse(
        #                 key, value
        #             ):
        #                 return JsonResponse(
        #                     {"success": True, "message": "Resource Pledged successfully"},
        #                     status=200,
        #                 )

        # # Process entries within "canShareMoreData" if present
        # can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        # for nested_key, nested_value in can_share_more_data.items():
        #     sharing_value = nested_value.get("enter_value")
        #     if sharing_value:
        #         if do_collateral_reverse(
        #             nested_key,
        #             sharing_value
        #         ):
        #             return JsonResponse(
        #                 {"success": True, "message": "Resource Pledged successful."},
        #                 status=200,
        #             )

        # return JsonResponse(
        #     {"success": False, "error": "No eligible file resource found for sharing"},
        #     status=400,
        # )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def share_confer_resource_v2(request):
    if request.method == "POST":
        try:
            # Check if the request user is authenticated
            if not request.user or not request.user.is_authenticated:
                return JsonResponse({"success": False, "error": "User not authenticated"}, status=401)

            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            guest_locker_name = body.get("guest_locker_name")
            guest_user_username = body.get("guest_user_username")
            xnode_id = body.get("xnode_id")
            share_Type = body.get("share_Type")
            old_xnode = body.get("old_xnode")

            # Check if all required fields are present
            if not all([
                connection_name,
                guest_locker_name,
                guest_user_username,
                xnode_id,
                share_Type
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )

            # Fetch the existing Xnode
            try:
                inode_xnode = Xnode_V2.objects.get(id=xnode_id)
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

            # Check if share_Type is valid
            if share_Type.lower() == "share":

                # Check if the creator and user are the same
                if inode_xnode.creator != request.user.user_id:
                    # Ensure sharing is allowed only if creator and host user are different
                    if not inode_xnode.post_conditions.get("share", False):
                        return JsonResponse({"success": False, "error": "Sharing is not allowed for this Resource"}, status=400)
                
                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["download", "confer", "collateral", "subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions


                # If old_xnode_id is provided, delete the old VNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old VNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted

           
                # If old_xnode_id is provided, delete the old VNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old VNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted

                # Create VNODE in guest locker
                xnode_created = Xnode_V2.objects.create(
                    locker=guest_locker,
                    creator=guest_user.user_id,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.VNODE,
                    post_conditions=post_conditions, 
                    # provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created.node_information = {
                    "current_owner": guest_user.user_id,
                    "link": xnode_id,
                    "reverse": False,
                }
                xnode_created.save()

                # # Update vnode_list in INODE
                # inode_xnode.vnode_list.append(xnode_created.id)  # Append new VNODE ID
                # inode_xnode.provenance_stack.insert(0, {
                #     "locker": guest_locker.locker_id,
                #     "connection": connection.connection_id,
                #     "user": guest_user.user_id
                # })
                # inode_xnode.save(update_fields=["vnode_list", "provenance_stack"])  # Save only vnode_list and provenance_stack

                return JsonResponse({
                    "success": True,
                    "message": f"VNODE Created Successfully: {xnode_created.id}",
                    "new_xnode_id": xnode_created.id  # Return the new VNODE ID for frontend update
                })

            elif share_Type.lower() == "confer":

                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check confer permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("confer", False):
                        print("Confer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)

      
                # Fetch host locker
                host_locker = connection.host_locker


                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions

                # If old_xnode_id is provided, delete the old SNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old SNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted


                # Create SNODE in host locker
                xnode_created_Snode = Xnode_V2.objects.create(
                    creator=guest_user.user_id,
                    locker=guest_locker,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.SNODE,
                    post_conditions=inode_xnode.post_conditions, 
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created_Snode.node_information = {
                    "resource_id": inode_xnode.node_information["resource_id"],
                    "inode_or_snode_id": inode_xnode.id,
                    "primary_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "current_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "reverse": False,
                }
                xnode_created_Snode.save()

                # # Update snode_list in INODE
                # inode_xnode.snode_list.append(xnode_created_Snode.id)
                # inode_xnode.provenance_stack.insert(0, {
                #     "locker": host_locker.locker_id,
                #     "connection": connection.connection_id,
                #     "user": guest_user.user_id
                # })
                # inode_xnode.save(update_fields=["snode_list", "provenance_stack"])  # Save only snode_list and provenance_stack

                return JsonResponse({
                    "success": True,
                    "message": f"SNODE Created Successfully: {xnode_created_Snode.id}",
                    "new_xnode_id": xnode_created_Snode.id  # Return the new SNODE ID for frontend update
                })
            
            elif share_Type.lower() == "transfer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                print("request user",request.user.user_id)
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check transfer permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("transfer", False):
                        print("Transfer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                    
                print("Assigning connection:", connection)
                print("Connection ID:", connection.connection_id if connection else None)

                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                                
                return JsonResponse({
                    "success": True,
                    #"message": f"Transfer operation successful",
                    "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                })

                
            elif share_Type.lower() == "collateral":

                # # If old_xnode_id is provided, remove its connection before proceeding
                # if old_xnode:
                #     try:
                #         old_xnode_obj = Xnode_V2.objects.get(id=old_xnode)
                #         old_xnode_obj.connection = None
                #         old_xnode_obj.save(update_fields=["connection"])
                #     except Xnode_V2.DoesNotExist:
                #         pass  # Proceed if already deleted

                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Collateral is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and  user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check collateral permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("collateral", False):
                        print("collateral is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                
                print("Assigning connection:", connection)
                print("Connection ID:", connection.connection_id if connection else None)

                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                                
                return JsonResponse({
                            "success": True,
                            #"message": f"Collateral operation successful",
                            "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                        })

            else:
                return JsonResponse({"success": False, "error": "Invalid share type"}, status=400)

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)



@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def share_confer_resource_reverse_v2(request):
    if request.method == "POST":
        try:
            # Check if the request user is authenticated
            if not request.user or not request.user.is_authenticated:
                return JsonResponse({"success": False, "error": "User not authenticated"}, status=401)

            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            host_user_username = body.get("host_user_username")
            xnode_id = body.get("xnode_id")
            share_Type = body.get("share_Type")
            old_xnode = body.get("old_xnode")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                host_user_username,
                xnode_id,
                share_Type
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
            )

            # Fetch the existing Xnode
            try:
                inode_xnode = Xnode_V2.objects.get(id=xnode_id)
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

            # Check if share_Type is valid
            if share_Type.lower() == "share":

                # Check if the creator and user are the same
                if inode_xnode.creator != request.user.user_id:
                    # Ensure sharing is allowed only if creator and host user are different
                    if not inode_xnode.post_conditions.get("share", False):
                        return JsonResponse({"success": False, "error": "Sharing is not allowed for this Resource"}, status=400)
                    
                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["download", "confer", "collateral", "subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions
           
                # If old_xnode_id is provided, delete the old VNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old VNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted
           
                # Create VNODE in host locker
                xnode_created = Xnode_V2.objects.create(
                    locker=host_locker,
                    creator=host_user.user_id,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.VNODE,
                    post_conditions=post_conditions,  # Copy terms from INODE
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created.node_information = {
                    "current_owner": host_user.user_id,
                    "link": xnode_id,
                    "reverse": True,
                }
                xnode_created.save()

                # # Update vnode_list in INODE
                # inode_xnode.vnode_list.append(xnode_created.id)  # Append new VNODE ID
                # inode_xnode.provenance_stack.insert(0, {
                #     "locker": host_locker.locker_id,
                #     "connection": connection.connection_id,
                #     "user": host_user.user_id
                # })
                # inode_xnode.save(update_fields=["vnode_list", "provenance_stack"])  # Save only vnode_list and provenance_stack

                return JsonResponse({
                    "success": True,
                    "message": f"VNODE Created Successfully: {xnode_created.id}",
                    "new_xnode_id": xnode_created.id  # Return the new VNODE ID for frontend update
                })

            elif share_Type.lower() == "confer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check confer permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("confer", False):
                        print("Confer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)

      
                # Fetch host locker
                host_locker = connection.host_locker


                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions

                # If old_xnode_id is provided, delete the old SNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old SNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted


                # Create SNODE in host locker
                xnode_created_Snode = Xnode_V2.objects.create(
                    creator=host_user.user_id,
                    locker=host_locker,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.SNODE,
                    post_conditions=inode_xnode.post_conditions,  # Copy terms from INODE
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created_Snode.node_information = {
                    "resource_id": inode_xnode.node_information["resource_id"],
                    "inode_or_snode_id": inode_xnode.id,
                    "primary_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "current_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "reverse": False,
                }
                xnode_created_Snode.save()

                # Update snode_list in INODE
                # inode_xnode.snode_list.append(xnode_created_Snode.id)
                # inode_xnode.provenance_stack.insert(0, {
                #     "locker": host_locker.locker_id,
                #     "connection": connection.connection_id,
                #     "user": host_user.user_id
                # })
                # inode_xnode.save(update_fields=["snode_list", "provenance_stack"])  # Save only snode_list and provenance_stack

                return JsonResponse({
                    "success": True,
                    "message": f"SNODE Created Successfully: {xnode_created_Snode.id}",
                    "new_xnode_id": xnode_created_Snode.id  # Return the new SNODE ID for frontend update
                })
            
            elif share_Type.lower() == "transfer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                print("request user",request.user.user_id)
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check transfer permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("transfer", False):
                        print("Transfer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                    
                return JsonResponse({
                    "success": True,
                    #"message": f"Transfer operation successful",
                    "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                })

            elif share_Type.lower() == "collateral":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Collateral is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and  user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check collateral permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("collateral", False):
                        print("collateral is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not allowed for this Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                    
                return JsonResponse({
                            "success": True,
                            #"message": f"Collateral operation successful",
                            "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                        })

            else:
                return JsonResponse({"success": False, "error": "Invalid share type"}, status=400)

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)



@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def share_resource_approve_v2(request):
    print("===== API called: share_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")
         
            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Share"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            vnode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            vnode_xnode.locker = host_locker
                            vnode_xnode.node_information["current_owner"] = host_user.user_id
                            vnode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {host_locker}.")

                            # Update is_locked based on post_conditions
                            post_conditions = vnode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            vnode_xnode.is_locked = is_locked
                            vnode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for Xnode {xnode_info}: {is_locked}")

                            linked_xnode_id = vnode_xnode.node_information["link"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)


                            print("--------------------------------")
                            new_entry = {
                                "connection": connection.connection_id,
                                "from_locker": guest_locker.locker_id,
                                "to_locker": host_locker.locker_id,
                                "from_user": guest_user.user_id,
                                "to_user": host_user.user_id,
                                "type_of_share": "Share",
                                "xnode_id": vnode_xnode.id,
                                "xnode_post_conditions": linked_xnode.post_conditions,
                                # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                "reverse": False
                            }

                            print("new_entry:", new_entry)

                            if not isinstance(linked_xnode.provenance_stack, list):
                                linked_xnode.provenance_stack = []
                            print("++++++++++++++++++++++++++++++++")

                            linked_xnode.provenance_stack.insert(0, new_entry)
                            linked_xnode.save(update_fields=["provenance_stack"])   


                            # utils.append_xnode_provenance(
                            #     xnode_instance = linked_xnode,
                            #     connection_id=connection.connection_id,
                            #     from_locker = guest_locker,
                            #     to_locker = host_locker,
                            #     from_user = guest_user,
                            #     to_user = host_user,
                            #     type_of_share = "Share",
                            #     xnode_post_conditions = linked_xnode.post_conditions,
                            #     reverse = False
                            # )

                            linked_inode = access_Resource(xnode_id=int(xnode_info))   

                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.vnode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["vnode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["link"]
                                    continue
                            
                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )
            else:
                print(f"Skipping {key}, it does not meet the sharing criteria.")
                return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value or {}
        resources = connection.resources.get("Share", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources shared successfully")
            return JsonResponse({"success": True, "message": "Resources shared successfully"}, status=200)
        else:
            print("No eligible file resource found for sharing.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for sharing"}, status=400)
                    
    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def confer_resource_approve_v2(request):
    print("===== API called: confer_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Confer"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            snode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            snode_xnode.locker = host_locker
                            snode_xnode.node_information["primary_owner"] = host_user.user_id
                            snode_xnode.node_information["current_owner"] = host_user.user_id
                            snode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {host_locker}.")

                            # Update is_locked based on post_conditions
                            post_conditions = snode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            snode_xnode.is_locked = is_locked
                            snode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for SNODE {xnode_info}: {is_locked}")


                            # Fetch the original INODE associated with this SNODE
                            xnode_id = snode_xnode.node_information.get("inode_or_snode_id", None)

                            if xnode_id:
                                try:
                                    xnode = Xnode_V2.objects.get(id=xnode_id)

                                    print("--------------------------------")
                                    new_entry = {
                                        "connection": connection.connection_id,
                                        "from_locker": guest_locker.locker_id,
                                        "to_locker": host_locker.locker_id,
                                        "from_user": guest_user.user_id,
                                        "to_user": host_user.user_id,
                                        "type_of_share": "Confer",
                                        "xnode_id": snode_xnode.id,
                                        "xnode_post_conditions": xnode.post_conditions,
                                        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                        "reverse": False
                                    }

                                    print("new_entry:", new_entry)

                                    if not isinstance(xnode.provenance_stack, list):
                                        xnode.provenance_stack = []
                                    print("++++++++++++++++++++++++++++++++")

                                    xnode.provenance_stack.insert(0, new_entry)
                                    xnode.save(update_fields=["provenance_stack"])   

                                    # utils.append_xnode_provenance(
                                    #     xnode_instance = xnode,
                                    #     connection_id=connection.connection_id,
                                    #     from_locker = guest_locker,
                                    #     to_locker = host_locker,
                                    #     from_user = guest_user,
                                    #     to_user = host_user,
                                    #     type_of_share = "Confer",
                                    #     xnode_post_conditions = xnode.post_conditions,
                                    #     reverse = False
                                    # )

                                    print(f"Found original INODE {xnode_id}, updating current owner to host user.")

                                    # Update INODE's current owner
                                    xnode.node_information["current_owner"] = host_user.user_id
                                    xnode.save(update_fields=["node_information"])

                                    print(f"Successfully updated INODE {xnode_id} current owner to {host_user.user_id}.")

                                except Xnode_V2.DoesNotExist:
                                    print(f"ERROR: INODE {xnode_id} not found in DB")
                                    return JsonResponse(
                                        {"success": False, "error": "Original INODE not found"}, status=404
                                    )

                            print(f"Successfully updated SNODE {xnode_info} ownership and linked INODE.")

                            linked_xnode_id = snode_xnode.node_information["inode_or_snode_id"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                            linked_inode = access_Resource(xnode_id=xnode_info)   

                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.snode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["snode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["inode_or_snode_id"]
                                    continue

                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )

            print(f"Skipping {key}, it does not meet the sharing criteria.")
            return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value or {}
        resources = connection.resources.get("Confer", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources conferred successfully")
            return JsonResponse({"success": True, "message": "Resources conferred successfully"}, status=200)
        else:
            print("No eligible file resource found for confering.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for conferring"}, status=400)
                    
    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def share_resource_approve_reverse_v2(request):
    print("===== API called: share_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Share"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            vnode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            vnode_xnode.locker = guest_locker
                            vnode_xnode.node_information["current_owner"] = guest_user.user_id
                            vnode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {guest_locker}.")

                            # Update is_locked based on post_conditions
                            post_conditions = vnode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            vnode_xnode.is_locked = is_locked
                            vnode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for Xnode {xnode_info}: {is_locked}")

                            linked_xnode_id = vnode_xnode.node_information["link"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                            print("--------------------------------")
                            new_entry = {
                                "connection": connection.connection_id,
                                "from_locker": host_locker.locker_id,
                                "to_locker": guest_locker.locker_id,
                                "from_user": host_user.user_id,
                                "to_user": guest_user.user_id,
                                "type_of_share": "Share",
                                "xnode_id": vnode_xnode.id,
                                "xnode_post_conditions": linked_xnode.post_conditions,
                                # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                "reverse": True
                            }

                            print("new_entry:", new_entry)

                            if not isinstance(linked_xnode.provenance_stack, list):
                                linked_xnode.provenance_stack = []
                            print("++++++++++++++++++++++++++++++++")

                            linked_xnode.provenance_stack.insert(0, new_entry)
                            linked_xnode.save(update_fields=["provenance_stack"])   

                            # utils.append_xnode_provenance(
                            #     xnode_instance = linked_xnode,
                            #     connection_id=connection.connection_id,
                            #     from_locker = host_locker,
                            #     to_locker = guest_locker,
                            #     from_user = host_user,
                            #     to_user = guest_user,
                            #     type_of_share = "Share",
                            #     xnode_post_conditions = linked_xnode.post_conditions,
                            #     reverse = True
                            # )

                            linked_inode = access_Resource(xnode_id=xnode_info)   

                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.vnode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["vnode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["link"]
                                    continue


                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )

            print(f"Skipping {key}, it does not meet the sharing criteria.")
            return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value_reverse)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value_reverse or {}
        resources = connection.resources.get("Share", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources shared successfully")
            return JsonResponse({"success": True, "message": "Resources shared successfully"}, status=200)
        else:
            print("No eligible file resource found for sharing.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for sharing"}, status=400)
                    
    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def confer_resource_approve_reverse_v2(request):
    print("===== API called: confer_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Confer"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            snode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            snode_xnode.locker = guest_locker
                            snode_xnode.node_information["primary_owner"] = guest_user.user_id
                            snode_xnode.node_information["current_owner"] = guest_user.user_id
                            snode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {guest_locker}.")
                            
                            # Update is_locked based on post_conditions
                            post_conditions = snode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            snode_xnode.is_locked = is_locked
                            snode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for SNODE {xnode_info}: {is_locked}")

                            # Fetch the original INODE associated with this SNODE
                            xnode_id = snode_xnode.node_information.get("inode_or_snode_id", None)

                            if xnode_id:
                                try:
                                    xnode = Xnode_V2.objects.get(id=xnode_id)

                                    print("--------------------------------")
                                    new_entry = {
                                        "connection": connection.connection_id,
                                        "from_locker": host_locker.locker_id,
                                        "to_locker": guest_locker.locker_id,
                                        "from_user": host_user.user_id,
                                        "to_user": guest_user.user_id,
                                        "type_of_share": "Confer",
                                        "xnode_id": snode_xnode.id,
                                        "xnode_post_conditions": xnode.post_conditions,
                                        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                        "reverse": True
                                    }

                                    print("new_entry:", new_entry)

                                    if not isinstance(xnode.provenance_stack, list):
                                        xnode.provenance_stack = []
                                    print("++++++++++++++++++++++++++++++++")

                                    xnode.provenance_stack.insert(0, new_entry)
                                    xnode.save(update_fields=["provenance_stack"])   

                                    # utils.append_xnode_provenance(
                                    #     xnode_instance = xnode,
                                    #     connection_id=connection.connection_id,
                                    #     from_locker = guest_locker,
                                    #     to_locker = host_locker,
                                    #     from_user = guest_user,
                                    #     to_user = host_user,
                                    #     type_of_share = "Confer",
                                    #     xnode_post_conditions = xnode.post_conditions,
                                    #     reverse = False
                                    # )

                                    print(f"Found original INODE {xnode_id}, updating current owner to host user.")

                                    # Update INODE's current owner
                                    xnode.node_information["current_owner"] = host_user.user_id
                                    xnode.save(update_fields=["node_information"])
                                    print(f"Found original INODE {xnode_id}, updating current owner to host user.")

                                    # Update INODE's current owner
                                    xnode.node_information["current_owner"] = guest_user.user_id
                                    xnode.save(update_fields=["node_information"])

                                    print(f"Successfully updated INODE {xnode_id} current owner to {guest_user.user_id}.")

                                except Xnode_V2.DoesNotExist:
                                    print(f"ERROR: INODE {xnode_id} not found in DB")
                                    return JsonResponse(
                                        {"success": False, "error": "Original INODE not found"}, status=404
                                    )
                                
                            
                            linked_xnode_id = snode_xnode.node_information["inode_or_snode_id"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                            linked_inode = access_Resource(xnode_id=xnode_info)   

                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.snode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["snode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["inode_or_snode_id"]
                                    continue


                            print(f"Successfully updated SNODE {xnode_info} ownership and linked INODE.")


                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )

            print(f"Skipping {key}, it does not meet the sharing criteria.")
            return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value_reverse)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value_reverse or {}
        resources = connection.resources.get("Confer", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources conferred successfully")
            return JsonResponse({"success": True, "message": "Resources conferred successfully"}, status=200)
        else:
            print("No eligible file resource found for confering.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for conferring"}, status=400)
                    

        # # Process top-level terms in connection.terms_value
        # for key, value in connection.terms_value_reverse.items():
        #     print(f"Checking top-level term: {key}")
        #     if process_sharable_entry(key, value, connection.resources.get("Confer", [])):
        #         print("Resource Conferring successful.")
        #         return JsonResponse(
        #             {"success": True, "message": "Resource Conferring successfully"}, status=200
        #         )


        # # Process entries within "canShareMoreData" if present
        # can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        # if can_share_more_data:
        #     print("Processing canShareMoreData terms...")
        #     for nested_key, nested_value in can_share_more_data.items():
        #         sharing_value = nested_value.get("enter_value")
        #         if sharing_value:
        #             print(f"Processing nested key: {nested_key} with value: {sharing_value}")
        #             if process_sharable_entry(nested_key, sharing_value, connection.resources.get("Confer", [])):
        #                 print("Resource Conferring successful via canShareMoreData.")
        #                 return JsonResponse(
        #                 {"success": True, "message": "Resource Conferring successfully"}, status=200
        #         )
                   
        # print("No eligible file resource found for sharing.")
        # return JsonResponse(
        #     {"success": False, "error": "No eligible file resource found for sharing"}, status=400
        # )

    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


def get_provenance_stack(xnode, connection, share_type, xnode_id):
    xnode = Xnode_V2.objects.get(id=xnode)
    print("xnode provenance:")
    print(xnode.provenance_stack)
    print("details")
    print(f"connection: {connection}, xnode_id = {xnode_id}, t_o_s = {str(xnode.provenance_stack[0]['type_of_share']).lower()}")
    
    for item in xnode.provenance_stack:
        conn = item.get('connection')
        print(f"l {connection} l connection:{conn}")
        x_id = item.get('xnode_id')
        print(f"l {xnode_id} l xnode_id:{x_id}")
        type_o_s =  item.get('type_of_share', '')
        print(f"l {type_o_s} l type_of_share:{type_o_s}")
        # if str(conn) == str(connection):
        if str(x_id) == str(xnode_id):
            if type_o_s == share_type:
                print("---------")
                print(f"item:{item}")
                return {
                    "connection": item.get("connection"),
                    "from_user": item.get("from_user"),
                    "to_user": item.get("to_user"),
                    "from_locker": item.get("from_locker"),
                    "to_locker": item.get("to_locker"),
                    "type_of_share": item.get("type_of_share"),
                    "reverse": item.get("reverse"),
                    "xnode_id": item.get("xnode_id"),
                    "xnode_post_conditions": item.get("xnode_post_conditions")
                }
            else:
                print("share not matched")
        else:
            print("xnode id not matched")
        # else:
        #     print("connection not matched")

    return None  # Return None if no match found

def delete_vnode(target, connections, notification_message):
    try:
        target = int(target)
        # Build mapping from child -> parent and parent -> list of children
        child_to_parent = {}
        parent_to_children = {}

        for relation in connections:
            for child, parent in relation.items():
                child_to_parent[int(child)] = int(parent)
                parent_to_children.setdefault(int(parent), []).append(int(child))

        deleted_pairs = []
        print(f"child_to_parent: {child_to_parent}")
        print(f"parent_to_children: {parent_to_children}")
        def delete_recursively(node):
            # Get children of the current node
            children = parent_to_children.get(node, [])
            print(f"children: {children}")
            print("he 1 re")
            for child in children:
                # Recurse if the child has further children
                if child in parent_to_children:
                    print(f"he 2 re {child}")
                    delete_recursively(child)
                print("he 3 re")
                child_xnode = Xnode_V2.objects.get(id=int(child))
                parent_xnode = Xnode_V2.objects.get(id=int(child_to_parent[child]))
                p_stack = get_provenance_stack(parent_xnode.id, parent_xnode.connection, "Share", child_xnode.id)
                link_connection = Connection.objects.get(connection_id=p_stack.get("connection"))
                print("he 4 re")
                Notification.objects.create(
                    connection=link_connection,
                    guest_user= CustomUser.objects.get(user_id=p_stack.get("to_user")),
                    host_user= CustomUser.objects.get(user_id=p_stack.get("to_user")),
                    guest_locker= Locker.objects.get(locker_id=p_stack.get("to_locker")),
                    host_locker= Locker.objects.get(locker_id=p_stack.get("to_locker")),
                    connection_type=link_connection.connection_type, 
                    created_at=timezone.now(),
                    message=notification_message,
                    notification_type="node_deleted",
                    target_type="xnode",
                    target_id=str(child_xnode.id),
                    extra_data={
                        "xnode_id": child_xnode.id,
                        "xnode_type": child_xnode.xnode_Type,
                        "locker_id": p_stack.get("to_locker"),
                        "locker_name": Locker.objects.get(locker_id=p_stack.get("to_locker")).name,
                        "user_id": p_stack.get("to_user"),
                        "username": CustomUser.objects.get(user_id=p_stack.get("to_user")).username,
                        "connection_id": link_connection.connection_id,
                        "connection_name": link_connection.connection_name,
                    }
                )
                print(f"Notification sent to {p_stack.get('to_user')} for affected locker {p_stack.get('to_locker')}")

                try:
                    temp_id = parent_xnode.id    
                    while True:
                        temp = Xnode_V2.objects.get(id=temp_id)
                        print("here 4.6")
                        if str(child_xnode.id) in map(str, temp.vnode_list):
                            temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(child_xnode.id)]
                            temp.save(update_fields=["vnode_list"])
                        if temp.xnode_Type == Xnode_V2.XnodeType.INODE or temp.xnode_Type == Xnode_V2.XnodeType.SNODE:
                            break
                        elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                            temp_id = temp.node_information["link"]
                        else:
                            break  # or raise an error if other types should not appear
                except Xnode_V2.DoesNotExist:
                    return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)

                child_xnode.delete()

                # Then delete the leaf child
                print(f"Deleting node: {child}")
                deleted_pairs.append({child: child_to_parent[child]})
                parent_to_children.pop(child, None)

            # Finally delete the current node
            # if node in child_to_parent:  # don't include the root if it's not a child
            #     print(f"Deleting node: {node}")
            #     deleted_pairs.append({node: child_to_parent[node]})
            # parent_to_children.pop(node, None)

        delete_recursively(target)
        return deleted_pairs
    except Exception as e:
        print(f"error deleting vnodes {str(e)}")

def revoke_share(connection_id, shared_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        for vnode_id in shared_resources:
            vnode = Xnode_V2.objects.get(id=vnode_id)
            linked_xnode_id = vnode.node_information["link"]
            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)
            print("here 1")
            inode = access_Resource(xnode_id=vnode_id)
            document_name = None
            print("here 2")
            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    document_name = "Unknown Resource"
            print("here 3")
            action = "reverted" if is_revert else "revoked"
            notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."

            #notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

            p_stack = get_provenance_stack(linked_xnode.id, connection_id, "Share", vnode_id)
            print("here 4")
            print(f"provenance: {p_stack}")
            print(f"vnode_list: {vnode.vnode_list}")
            if not vnode.vnode_list:
                print("here 4.1")
                Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                )
                print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")
            else:
                print("here 4.2")
                linked_vnodes = [{vnode_id:linked_xnode_id}]
                for v_id in vnode.vnode_list:
                    print("here 4.3")
                    v_node = Xnode_V2.objects.get(id=v_id)
                    link = v_node.node_information["link"]
                    linked_vnodes.append({int(v_id) : int(link)})
                
                delete_vnode(vnode_id, linked_vnodes, notification_message)
                # for k,v in linked_vnodes.items():
                #     print("here 4.4")
                #     if k not in linked_vnodes.values():
                #         continue
                #     else:
                #         k_xnode = Xnode_V2.objects.get(id=k)
                #         k_link_xnode = Xnode_V2.objects.get(id=v)
                #         print("here 4.5")
                #         k_link_p_stack = get_provenance_stack(k_link_xnode.id, connection_id, "Share", k)
                #         k_link_connection = Connection.objects.get(connection_id=k_link_p_stack.get("connection"))
                #         Notification.objects.create(
                #             connection=k_link_connection,
                #             guest_user= CustomUser.objects.get(user_id=k_link_p_stack.get("to_user")),
                #             host_user= CustomUser.objects.get(user_id=k_link_p_stack.get("to_user")),
                #             guest_locker= Locker.objects.get(locker_id=k_link_p_stack.get("to_locker")),
                #             host_locker= Locker.objects.get(locker_id=k_link_p_stack.get("to_locker")),
                #             connection_type=k_link_connection.connection_type,
                #             created_at=timezone.now(),
                #             message=notification_message,
                #         )
                #         print(f"Notification sent to {k_link_p_stack.get('to_user')} for affected locker {k_link_p_stack.get('to_locker')}")

                #         try:
                #             temp_id = linked_xnode_id    
                #             while True:
                #                 temp = Xnode_V2.objects.get(id=temp_id)
                #                 print("here 4.6")
                #                 if str(k) in map(str, temp.vnode_list):
                #                     temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(k)]
                #                     temp.save(update_fields=["vnode_list"])
                #                 if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                #                     break
                #                 elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                #                     temp_id = temp.node_information["link"]
                #                 else:
                #                     break  # or raise an error if other types should not appear
                #         except Xnode_V2.DoesNotExist:
                #             return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)

                #         k_xnode.delete()
            
            print("here 5")
            try:
                temp_id = linked_xnode_id    
                while True:
                    temp = Xnode_V2.objects.get(id=temp_id)
                    print(f"vnode_id : {vnode_id} || vnode_list : {temp.vnode_list}")
                    if str(vnode_id) in map(str, temp.vnode_list):
                        temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(vnode_id)]
                        temp.save(update_fields=["vnode_list"])
                    
                    if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                        print("break loop")
                        break
                    elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                        temp_id = temp.node_information["link"]
                    else:
                        break  # or raise an error if other types should not appear
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)
            except Exception as e:
                return JsonResponse({"success": False, "error": e}, status=400)
            print("here 6")
            linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")
            linked_xnode.save(update_fields=["post_conditions"])        
            print("here 7")
            utils.remove_xnode_provenance_entry(
                xnode_instance = linked_xnode.id,
                connection_id = connection_id,
                from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                type_of_share= "Share",
                xnode_id=vnode_id
            )
            print("here 8")
            vnode.delete()
            print("here 9")
        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": e}, status=400)

def revoke_transfer(connection_id, transferred_resources, host_user, host_locker, guest_user, guest_locker): 
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        for xnode_id in transferred_resources:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            node_type = xnode.xnode_Type
            print(f"Doing for xnode id:{xnode_id}")

            # **Find the associated INODE to fetch resource name**
            inode = access_Resource(xnode_id=xnode.id)
            document_name = None

            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    document_name = "Unknown Resource"
            print("here 1")

            # action = "reverted" if is_revert else "revoked"
            # notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."
            notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

            # Locate and remove all child VNODEs and SNODEs that belong to the INODE currently being transferred and also send notification to affected user
            if xnode.vnode_list or xnode.snode_list:
                # Delete all descendants recursively and get the deleted node IDs
                deleted_node_ids = delete_descendants(xnode)

                # Clear vnode_list and snode_list in the original node
                xnode.vnode_list = []
                xnode.snode_list = []
                xnode.save(update_fields=["vnode_list", "snode_list"])
                print(f"Cleared vnode_list and snode_list in original Xnode: {xnode.id}")
                print("here 2")
                # Notify affected users based on deleted_node_ids
                affected_lockers = Locker.objects.filter(xnode_v2__id__in=deleted_node_ids)
                affected_users = set(locker.user for locker in affected_lockers)
                print(affected_lockers)
                print("here 3")
                for user in affected_users:
                    user_lockers = affected_lockers.filter(user=user) 

                    if not user_lockers.exists():
                        print(f"Warning: No affected lockers found for user {user.username}. Skipping notification.")
                        continue
                    print("here 4")        
                    for locker in user_lockers:
                        Notification.objects.create(
                            connection=connection,
                            guest_user=user,
                            host_user=user,
                            guest_locker=locker,
                            host_locker=locker,
                            connection_type=connection.connection_type,
                            created_at=timezone.now(),
                            message=notification_message,
                        )
                        print(f"Notification sent to {user.username} for affected locker {locker.name}")
                        print("here 5")

            # If VNODE, transfer without lock check
            print("Entering VNODE Transfer Block...")
            
            p_stack = get_provenance_stack(xnode.id, connection.connection_id, "Transfer", xnode_id)

            if node_type == Xnode_V2.XnodeType.VNODE:
                print("Inside VNODE Transfer Block")
                print(f"Before Transfer VNODE: {xnode.node_information}")
                print("here 5.1")
                # Modify owner
                xnode.node_information["owner"] = p_stack.get("from_user")
                # xnode.node_information["owner"] = host_user.user_id if not p_stack.get("reverse") else guest_user.user_id
                xnode.locker = Locker.objects.get(locker_id = p_stack.get("from_locker"))
                # xnode.locker = host_locker if not p_stack.get("reverse") else guest_locker
                
                # Print before saving
                print(f"Before Saving VNODE: {xnode.node_information}")

                
                xnode.post_conditions = p_stack.get("xnode_post_conditions")

                # Save only JSON field
                xnode.save(update_fields=["post_conditions", "locker", "node_information"])
                print("here 5.2")

                utils.remove_xnode_provenance_entry(
                    xnode_instance = xnode.id,
                    connection_id = connection.connection_id,
                    from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                    to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                    from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                    to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                    type_of_share= "Transfer"
                )
        
                # Print after saving
                print(f"After Transfer VNODE: {xnode.node_information}")
                

            # Transfer INODE or SNODE
            if node_type in [Xnode_V2.XnodeType.INODE, Xnode_V2.XnodeType.SNODE]:
                print(f"Before locker: {xnode.locker.locker_id}")
                xnode.node_information["primary_owner"] = p_stack.get("from_user")
                # xnode.node_information["primary_owner"] = host_user.user_id if not p_stack.get("reverse") else guest_user.user_id
                xnode.node_information["current_owner"] = p_stack.get("from_user")
                # xnode.node_information["current_owner"] = host_user.user_id if not p_stack.get("reverse") else guest_user.user_id
                xnode.locker = Locker.objects.get(locker_id = p_stack.get("from_locker"))

                xnode.post_conditions = p_stack.get("xnode_post_conditions")
                print("here 6.1")
                # Save only JSON field
                xnode.save(update_fields=["post_conditions", "locker", "node_information"])
                print(f"Afterlocker: {xnode.locker.locker_id}")

                utils.remove_xnode_provenance_entry(
                    xnode_instance = xnode.id,
                    connection_id = connection.connection_id,
                    from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                    to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                    from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                    to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                    type_of_share= "Transfer",
                    xnode_id=xnode.id
                )
                print("here 6.2")
                
                if inode and inode.post_conditions:
                    post_conditions = inode.post_conditions
                    is_locked = {}
                    for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        is_locked[k] = not post_conditions.get(k, False)
                    print("here 6.3")
                    xnode.is_locked = is_locked
                    xnode.save(update_fields=["is_locked"])
                    print(f"Updated is_locked for transferred Xnode {xnode.id}: {is_locked}")
            Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                )
            print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")

        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": e}, status=400)

def revoke_collateral(connection_id, collateral_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        print("1 here")
        for inode_id in collateral_resources:  
            # inode = Xnode_V2.objects.get(id=inode_id)
            print(inode_id)
            snodes = Xnode_V2.objects.filter(
                Q(node_information__inode_or_snode_id=int(inode_id)) 
                # Q(connection=connection.connection_id) 
                # Q(node_information__resource_id=inode.node_information["resource_id"])
            )
            print("2 here")
            print(f"snodes={snodes}")
            print(f"first snode = {snodes.first()}")
            print(f"is it none? {snodes.first() is None}")
            if len(snodes) == 1:
                snode = snodes.first()
                if snode is None:
                    print("-------none found")
                print(f"snode Id: {snode.id}")
                linked_xnode_id = snode.node_information["inode_or_snode_id"]
                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)
                print("3 here")

                inode = access_Resource(xnode_id=snode.id)
                document_name = None

                if inode:
                    try:
                        resource = Resource.objects.get(
                            resource_id=inode.node_information.get("resource_id")
                        )
                        document_name = resource.document_name
                    except Resource.DoesNotExist:
                        document_name = "Unknown Resource"

                action = "reverted" if is_revert else "revoked"
                notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."

                #notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

                p_stack = get_provenance_stack(linked_xnode_id, connection.connection_id, "Collateral", snode.id)
                print("4 here")

                if p_stack is None:
                    print("provenance is returning null")
                    return JsonResponse({"success": False, "error": "provenance is returning null"}, status = 400)

                if not snode.vnode_list:
                    Notification.objects.create(
                        connection=connection,
                        guest_user=host_user if not p_stack.get("reverse") else guest_user,
                        host_user=host_user if not p_stack.get("reverse") else guest_user,
                        guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                        host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                        connection_type=connection.connection_type,
                        created_at=timezone.now(),
                        message=notification_message,
                        notification_type="node_deleted",
                        target_type="xnode",
                        target_id=str(snode.id),
                        extra_data={
                            "xnode_id": snode.id,
                            "xnode_type": snode.xnode_Type,
                            "locker_id": p_stack.get("to_locker"),
                            "locker_name": Locker.objects.get(locker_id=p_stack.get("to_locker")).name,
                            "user_id": p_stack.get("to_user"),
                            "username": CustomUser.objects.get(user_id=p_stack.get("to_user")).username,
                            "connection_id": connection.connection_id,
                            "connection_name": connection.connection_name,
                        }
                    )
                    print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")
                else:
                    linked_vnodes = [{snode.id:linked_xnode_id}]
                    for v_id in snode.vnode_list:
                        print("here 4.3")
                        v_node = Xnode_V2.objects.get(id=v_id)
                        link = v_node.node_information["link"]
                        linked_vnodes.append({int(v_id) : int(link)})
                
                    delete_vnode(snode.id, linked_vnodes, notification_message)
                print("7 here")
                if str(snode.id) in map(str, linked_xnode.snode_list):
                    linked_xnode.snode_list = [s for s in linked_xnode.snode_list if str(s) != str(snode.id)]
                linked_xnode.locker = host_locker if p_stack.get("reverse") else guest_locker
                linked_xnode.connection = None
                linked_xnode.node_information["current_owner"] = host_user.user_id if p_stack.get("reverse") else guest_user.user_id
                linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")
                print("8 here")
                linked_xnode.save(update_fields=["snode_list","post_conditions","node_information","connection","locker"])

                utils.remove_xnode_provenance_entry(
                    xnode_instance = linked_xnode.id,
                    connection_id = connection.connection_id,
                    from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                    to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                    from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                    to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                    type_of_share= "Collateral",
                    xnode_id=snode.id
                )
                print("9 here")
                snode.delete()
            else:
                return JsonResponse({"success": False, "error": "multiple or no snodes found"}, status=400)
            

        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200) 
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": e}, status=400) 


def revoke_confer(connection_id, conferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        print("1 here")
        for snode_id in conferred_resources:   
            snode = Xnode_V2.objects.get(id=snode_id)
            linked_xnode_id = snode.node_information["inode_or_snode_id"]
            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

            inode = access_Resource(xnode_id=snode_id)
            document_name = None

            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    document_name = "Unknown Resource"
            
            action = "reverted" if is_revert else "revoked"
            notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."

            #notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

            p_stack = get_provenance_stack(linked_xnode.id, connection.connection_id, "Confer", snode_id)

            if not snode.vnode_list:
                Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                    notification_type="node_deleted",
                    target_type="xnode",
                    target_id=str(snode.id),
                    extra_data={
                        "xnode_id": snode.id,
                        "xnode_type": snode.xnode_Type,
                        "locker_id": p_stack.get("to_locker"),
                        "locker_name": Locker.objects.get(locker_id=p_stack.get("to_locker")).name,
                        "user_id": p_stack.get("to_user"),
                        "username": CustomUser.objects.get(user_id=p_stack.get("to_user")).username,
                        "connection_id": connection.connection_id,
                        "connection_name": connection.connection_name,
                    }
                )
                print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")
            else:
                linked_vnodes = [{snode.id:linked_xnode_id}]
                for v_id in snode.vnode_list:
                    print("here 4.3")
                    v_node = Xnode_V2.objects.get(id=v_id)
                    link = v_node.node_information["link"]
                    linked_vnodes.append({int(v_id) : int(link)})
            
                delete_vnode(snode.id, linked_vnodes, notification_message)

            try:
                temp_id = linked_xnode.id    
                while True:
                    temp = Xnode_V2.objects.get(id=temp_id)
                    if str(snode_id) in map(str, temp.snode_list):
                        temp.snode_list = [s for s in temp.snode_list if str(s) != str(snode_id)]
                        temp.save(update_fields=["snode_list"])
                    
                    if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                        break
                    elif temp.xnode_Type == Xnode_V2.XnodeType.SNODE:
                        temp_id = temp.node_information["inode_or_snode_id"]
                    else:
                        break  # or raise an error if other types should not appear
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)
            linked_xnode.locker = host_locker if p_stack.get("reverse") else guest_locker
            linked_xnode.connection = None
            linked_xnode.node_information["current_owner"] = host_user.user_id if p_stack.get("reverse") else guest_user.user_id
            linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")

            linked_xnode.save()

            utils.remove_xnode_provenance_entry(
                xnode_instance = linked_xnode.id,
                connection_id = connection_id,
                from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                type_of_share= "Confer",
                xnode_id=snode_id
            )

            snode.delete()

        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200) 
    except Exception as e:
        print(f"confer error: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=400)

def revoke(connection_id, host_user, host_locker, guest_user, guest_locker):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        shared_resources = []
        transferred_resources = []
        collateralled_resources = []
        conferred_resources = []
        
        # Your existing code to populate the resource lists...
        for terms in [connection.terms_value, connection.terms_value_reverse]:
            print(f"Termss:::: {terms}")
            for key, value in terms.items():
                if not isinstance(value, str) or '|' not in value or ';' not in value:
                    continue
                
                try:
                    part1, rest = value.split("|")
                    xnode_id, approval_status = rest.split(";")
                except ValueError:
                    continue
                if approval_status.strip() == "T":
                    conn_term = ConnectionTerms.objects.get(
                        conn_type_id=connection.connection_type_id,
                        data_element_name=key
                    )
                    if conn_term.sharing_type == "share":
                        shared_resources.append(xnode_id)
                    elif conn_term.sharing_type == "transfer":
                        transferred_resources.append(xnode_id)
                    elif conn_term.sharing_type == "collateral":
                        collateralled_resources.append(xnode_id)
                    elif conn_term.sharing_type == "confer":
                        conferred_resources.append(xnode_id)

        results = []
        
        if shared_resources:
            print(f"--------------------Revoking share: {shared_resources}")
            result = revoke_share(connection.connection_id, shared_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        if collateralled_resources:
            print(f"--------------------Revoking Collateral: {collateralled_resources}")
            result = revoke_collateral(connection.connection_id, collateralled_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        if transferred_resources:
            print(f"--------------------Revoking transfer: {transferred_resources}")
            result = revoke_transfer(connection.connection_id, transferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        if conferred_resources:
            print(f"--------------------Revoking confer: {conferred_resources}")
            result = revoke_confer(connection.connection_id, conferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        for result in results:
            if result.status_code != 200:
                return result
        
        return JsonResponse({"success": True, "message": "Successfully revoked all resources"}, status=200)
        
    except Exception as e:
        print(f"revoke error: {e}")
        return JsonResponse({"success": False, "error": str(e)}, status=400)

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revoke_consent(request):
    """
    Revoke for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful revocation of consent.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: User not authenticated.
    - 403: Permission denied.
    - 404: Connection or user or locker not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "error": "User not authenticated"}, status=401
        )
    
    print("-----------------------------------------------------------")
    print(f"Connection name: {request.POST.get('connection_name')}")
    print(f"Connection type name: {request.POST.get('connection_type_name')}")
    print(f"Guest username: {request.POST.get('guest_username')}")
    print(f"Guest lockername: {request.POST.get('guest_lockername')}")
    print(f"Host username: {request.POST.get('host_username')}")
    print(f"Host lockername: {request.POST.get('host_lockername')}")

    # Extract form data
    connection_name = request.POST.get("connection_name")
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")

    # Check if all required fields are present
    # Required fields and their values
    required_fields = {
        "connection_name": connection_name,
        "connection_type_name": connection_type_name,
        "guest_username": guest_username,
        "guest_lockername": guest_lockername,
        "host_username": host_username,
        "host_lockername": host_lockername,
    }

    # Check if all required fields are present
    if None in [
        connection_name,
        connection_type_name,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        # Retrieve the guest user and guest locker
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)

        # Retrieve the host user and host locker
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Retrieve the connection type
        try:
            connection_type = ConnectionType.objects.get(
                connection_type_name__iexact=connection_type_name
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Connection type not found: {connection_type_name}",
                },
                status=404,
            )

        # Retrieve the connection
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type_id=connection_type,
                guest_user=guest_user,
                host_user=host_user,
                guest_locker=guest_locker,
                host_locker=host_locker
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        # Check if the requesting user is either the host or guest user
        if request.user != host_user and request.user != guest_user:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )
        
        #check if connection is closed
        # if connection.connection_status != "closed":
        #     return JsonResponse({"message":"Conection needs to be closed to revoke."},status=400)

        # Set requester_consent to False
        connection.requester_consent = False

        if request.user == guest_user:
            connection.revoke_guest = True
        else:
            connection.revoke_host = True

        # Save the connection
        connection.save(update_fields=["requester_consent", "revoke_guest", "revoke_host"])

        # Check modality
        terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
        forbidden = any(term.modality.lower() == "forbidden" for term in terms)
        
        if forbidden:
            if connection.revoke_guest and not connection.revoke_host:
                return JsonResponse({"success": False, "error": "Guest has revoked. Waiting for Host to revoke."},status=403)
            elif connection.revoke_host and not connection.revoke_guest:
                return JsonResponse({"success": False, "error": "Host has revoked. Waiting for Guest to revoke."},status=403)
            elif connection.revoke_guest and connection.revoke_host:
                print("--------------------Revoking both guest and host")
                revoke(connection.connection_id, host_user.user_id, host_locker.locker_id, guest_user.user_id, guest_locker.locker_id)
                connection.connection_status = 'revoked'
                connection.save(update_fields=["connection_status"])
        else:
            print("+++++++++++++++Revoking both guest and host")
            revoke(connection.connection_id, host_user.user_id, host_locker.locker_id, guest_user.user_id, guest_locker.locker_id)
            connection.connection_status = 'revoked'
            connection.save(update_fields=["connection_status"])

        # if request.user != guest_user:
        #     connection.revoke_guest = True
        #     connection.save(update_fields=["revoke_guest"])
        # else:
        #     connection.revoke_host = True
        #     connection.save(update_fields=["revoke_host"])

        # connection.close_guest = True
        # connection.close_host = True
        # connection.connection_status = 'closed'

        # connection.save(update_fields=["connection_status", "close_host", "close_guest"])


        return JsonResponse(
            {"success": True, "message": "Consent revoked successfully"}, status=200
        )

    except CustomUser.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"User not found: {str(e)}"}, status=404
        )
    except Locker.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"Locker not found: {str(e)}"}, status=404
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "error": f"An error occurred: {str(e)}"}, status=400
        )


# @api_view(['POST'])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def revert_consent(request):
#     print("Revert Consent Initiated")

#     user = request.user
#     xnode_id = request.data.get("xnode_id")
#     reason = request.data.get("revert_reason", "").strip()

#     if not xnode_id:
#         return JsonResponse({"success": False, "error": "Missing xnode_id"})

#     try:
#         xnode = Xnode_V2.objects.get(id=xnode_id)
#         print(f"Xnode {xnode_id} found")
#     except Xnode_V2.DoesNotExist:
#         return JsonResponse({"success": False, "error": "Xnode not found"})

#     connection = xnode.connection
#     if not connection:
#         fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
#         if fallback_id:
#             try:
#                 parent_xnode = Xnode_V2.objects.get(id=fallback_id)
#                 if parent_xnode.connection:
#                     xnode = parent_xnode
#                     connection = xnode.connection
#                     print("Fallback to parent xnode")
#             except Exception as e:
#                 print("Fallback failed:", str(e))

#     if not connection:
#         return JsonResponse({"success": False, "error": "No connection associated with this consent"})

#     host_user = connection.host_user
#     guest_user = connection.guest_user
#     host_locker = connection.host_locker
#     guest_locker = connection.guest_locker

#     if user != host_user and user != guest_user:
#         return JsonResponse({"success": False, "error": "only Host or Guest can revert"}, status=403)

#     def detect_share_type(x):
#         def all_terms_dicts():
#             for terms in [connection.terms_value, connection.terms_value_reverse]:
#                 if not isinstance(terms, dict):
#                     continue
#                 merged = dict(terms)
#                 if "canShareMoreData" in terms and isinstance(terms["canShareMoreData"], dict):
#                     merged.update(terms["canShareMoreData"])
#                 yield merged

#         for terms_dict in all_terms_dicts():
#             for key, value in terms_dict.items():
#                 try:
#                     if isinstance(value, str):
#                         # Regular top-level case
#                         _, rest = value.split("|")
#                         term_xnode_id, approval = rest.split(";")
#                         if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
#                             conn_term = ConnectionTerms.objects.get(
#                                 conn_type_id=connection.connection_type_id,
#                                 data_element_name=key
#                             )
#                             return conn_term.sharing_type
#                     elif isinstance(value, dict):
#                         # Nested case from canShareMoreData
#                         enter_val = value.get("enter_value", "")
#                         type_of_share = value.get("typeOfShare", "").lower()
#                         _, rest = enter_val.split("|")
#                         term_xnode_id, approval = rest.split(";")
#                         if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
#                             return type_of_share  # Directly return type from dict
#                 except Exception as e:
#                     print(f"Error while parsing term: {e}")
#                     continue
#         return None


#     share_type = detect_share_type(xnode)

#     # Final fallback to parent
#     if not share_type:
#         fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
#         if fallback_id:
#             try:
#                 parent_xnode = Xnode_V2.objects.get(id=fallback_id)
#                 share_type = detect_share_type(parent_xnode)
#                 if share_type:
#                     xnode = parent_xnode
#                     print("Final fallback to parent xnode for share_type detection")
#             except:
#                 pass

#     if not share_type:
#         return JsonResponse({"success": False, "error": "No share type found for this resource"})

#     print(f" Detected share_type = {share_type}")

#     document_name = "Unknown Resource"
#     inode = access_Resource(xnode_id=xnode.id)
#     if inode:
#         try:
#             res_id = inode.node_information.get("resource_id")
#             resource = Resource.objects.get(resource_id=res_id)
#             document_name = resource.document_name
#         except:
#             pass

#     # Collateral logic
#     if share_type.lower() == "collateral":
#         revert_req, created = CollateralRevertRequest.objects.get_or_create(
#             xnode=xnode,
#             connection=connection,
#             defaults={
#                 "host_revert": user == host_user,
#                 "guest_revert": user == guest_user,
#                 "revert_reason": reason,
#                 "created_at": timezone.now(),
#                 "reverted": False,
#                 "original_requested_xnode": Xnode_V2.objects.get(id=xnode_id)
#             }
#         )

#         # If request already exists and same user already approved before
#         if not created:
#             if (user == host_user and revert_req.host_revert) or (user == guest_user and revert_req.guest_revert):
#                 sender_role = "Host" if user == host_user else "Guest"
#                 pending_role = "Guest" if sender_role == "Host" else "Host"
#                 return JsonResponse({
#                     "success": True,
#                     "message": f"{sender_role} has already requested a revert. Waiting for {pending_role} to approve."
#                 })

#             # Update the approval flag
#             updated_fields = []
#             if user == host_user and not revert_req.host_revert:
#                 revert_req.host_revert = True
#                 updated_fields.append("host_revert")
#             elif user == guest_user and not revert_req.guest_revert:
#                 revert_req.guest_revert = True
#                 updated_fields.append("guest_revert")

#             # Save reason only if not already set
#             if reason and not revert_req.revert_reason:
#                 revert_req.revert_reason = reason
#                 updated_fields.append("revert_reason")

#             if updated_fields:
#                 revert_req.save(update_fields=updated_fields)

#         # If both approved now → perform the actual revert
#         if revert_req.host_revert and revert_req.guest_revert and not revert_req.reverted:
#             revoke_collateral(connection.connection_id, [xnode.id], host_user.user_id,
#                             host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
#                             is_revert=True)
#             revert_req.reverted = True
#             revert_req.save(update_fields=["reverted"])
#             return JsonResponse({"success": True, "message": "Collateral consent has been successfully reverted by both parties."})

#         # Send notification to the opposite party only on first user request
#         if created:
#             # Determine the recipient (opposite party)
#             is_host = user == host_user
#             target_user = guest_user if is_host else host_user  # The one who should receive
#             target_locker = guest_locker if is_host else host_locker
#             user_locker = host_locker if is_host else guest_locker  # locker of the sender

#             Notification.objects.create(
#                 connection=connection,
#                 host_user=target_user,       # Recipient becomes host_user
#                 guest_user=user,             # Sender becomes guest_user
#                 host_locker=target_locker,   # Recipient's locker
#                 guest_locker=user_locker,    # Sender's locker
#                 connection_type=connection.connection_type,
#                 created_at=timezone.now(),
#                 message=f"User '{user.username}' has requested to withdraw the collateral provided for the consent '{document_name}'. Please review and approve or reject the request.",
#                 notification_type="revert_approval_pending",
#                 target_type="xnode",
#                 target_id=str(xnode.id),
#                 extra_data={
#                     "xnode_id": xnode.id,
#                     "connection_id": connection.connection_id,
#                     "revert_reason": reason
#                 }
#             )

#         # Return current approval state
#         if revert_req.host_revert and not revert_req.guest_revert:
#             return JsonResponse({"success": True, "message": "Revert request sent by Host. Waiting for Guest approval."})
#         elif revert_req.guest_revert and not revert_req.host_revert:
#             return JsonResponse({"success": True, "message": "Revert request sent by Guest. Waiting for Host approval."})
#         else:
#             return JsonResponse({"success": True, "message": f"Consent revert request has been sent by {user.username} for '{share_type}' type."})


#     # Non-collateral: unilateraly can do the revert
#     print(f"Creating revert request for non-collateral: {xnode.id} {connection.connection_id}")
#     revert_req, created = CollateralRevertRequest.objects.get_or_create(
#         xnode=xnode,
#         connection=connection,
#         defaults={
#             "host_revert": user == host_user,
#             "guest_revert": user == guest_user,
#             "revert_reason": reason,
#             "created_at": timezone.now(),
#             "reverted": True,
#             "original_requested_xnode": Xnode_V2.objects.get(id=xnode_id)
#         }
#     )
#     if not created:
#         if user == host_user:
#             revert_req.host_revert = True
#         elif user == guest_user:
#             revert_req.guest_revert = True
#         revert_req.revert_reason = reason
#         revert_req.reverted = True
#         revert_req.save(update_fields=["host_revert", "guest_revert", "revert_reason", "reverted"])

#     print(" Created revert entry successfully ")

#     # Actual revert call
#     if share_type == "share":
#         revoke_share(connection.connection_id, [xnode.id], host_user.user_id,
#                      host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
#                      is_revert=True)
#     elif share_type == "confer":
#         revoke_confer(connection.connection_id, [xnode.id], host_user.user_id,
#                       host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
#                       is_revert=True)
#     # elif share_type == "transfer":
#     #     revoke_transfer(connection.connection_id, [xnode.id], host_user.user_id,
#     #                     host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
#     #                     is_revert=True)
#     else:
#         return JsonResponse({"success": False, "error": f"Unsupported share_type: {share_type}"})

#     return JsonResponse({"success": True, "message": f"{share_type.capitalize()} consent reverted successfully."})


#revert use xnode table
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revert_consent(request):
    print("Revert Consent Initiated")

    user = request.user
    xnode_id = request.data.get("xnode_id")
    reason = request.data.get("revert_reason", "").strip()

    if not xnode_id:
        return JsonResponse({"success": False, "error": "Missing xnode_id"})

    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
        print(f"Xnode {xnode_id} found")
    except Xnode_V2.DoesNotExist:
        return JsonResponse({"success": False, "error": "Xnode not found"})

    connection = xnode.connection
    if not connection:
        fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
        if fallback_id:
            try:
                parent_xnode = Xnode_V2.objects.get(id=fallback_id)
                if parent_xnode.connection:
                    xnode = parent_xnode
                    connection = xnode.connection
                    print("Fallback to parent xnode")
            except Exception as e:
                print("Fallback failed:", str(e))

    if not connection:
        return JsonResponse({"success": False, "error": "No connection associated with this consent"})

    host_user = connection.host_user
    guest_user = connection.guest_user
    host_locker = connection.host_locker
    guest_locker = connection.guest_locker

    if user != host_user and user != guest_user:
        return JsonResponse({"success": False, "error": "only Host or Guest can revert"}, status=403)

    def detect_share_type(x):
        def all_terms_dicts():
            for terms in [connection.terms_value, connection.terms_value_reverse]:
                if not isinstance(terms, dict):
                    continue
                merged = dict(terms)
                if "canShareMoreData" in terms and isinstance(terms["canShareMoreData"], dict):
                    merged.update(terms["canShareMoreData"])
                yield merged

        for terms_dict in all_terms_dicts():
            for key, value in terms_dict.items():
                try:
                    if isinstance(value, str):
                        # Regular top-level case
                        _, rest = value.split("|")
                        term_xnode_id, approval = rest.split(";")
                        if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
                            conn_term = ConnectionTerms.objects.get(
                                conn_type_id=connection.connection_type_id,
                                data_element_name=key
                            )
                            return conn_term.sharing_type
                    elif isinstance(value, dict):
                        # Nested case from canShareMoreData
                        enter_val = value.get("enter_value", "")
                        type_of_share = value.get("typeOfShare", "").lower()
                        _, rest = enter_val.split("|")
                        term_xnode_id, approval = rest.split(";")
                        if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
                            return type_of_share  # Directly return type from dict
                except Exception as e:
                    print(f"warning while parsing term: {e}")
                    continue
        return None


    share_type = detect_share_type(xnode)

    # Final fallback to parent
    if not share_type:
        fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
        if fallback_id:
            try:
                parent_xnode = Xnode_V2.objects.get(id=fallback_id)
                share_type = detect_share_type(parent_xnode)
                if share_type:
                    xnode = parent_xnode
                    print("Final fallback to parent xnode for share_type detection")
            except:
                pass

    if not share_type:
        return JsonResponse({"success": False, "error": "No share type found for this resource"})

    print(f" Detected share_type = {share_type}")

    document_name = "Unknown Resource"
    inode = access_Resource(xnode_id=xnode.id)
    if inode:
        try:
            res_id = inode.node_information.get("resource_id")
            resource = Resource.objects.get(resource_id=res_id)
            document_name = resource.document_name
        except:
            pass

    is_host = user == host_user
    target_user = guest_user if is_host else host_user
    target_locker = guest_locker if is_host else host_locker
    user_locker = host_locker if is_host else guest_locker

    # Collateral logic
    if share_type.lower() == "collateral":

        # Prepare list of nodes to update: original xnode + linked node from same collateral
        xnodes_to_update = [xnode]  # Always include the request node

        # Check if revert already requested by this user
        pending_user = guest_user.username if is_host else host_user.username
        already_requested = ((is_host and xnode.host_revert_status == 1) or(not is_host and xnode.guest_revert_status == 1))
        if already_requested:
            return JsonResponse({
                "success": False,
                "message": f"You've already sent a revert request. Waiting for approval from '{pending_user}'."
            })


        # Handle parent → child
        if xnode.xnode_Type in [Xnode_V2.XnodeType.INODE, Xnode_V2.XnodeType.SNODE]:
            possible_children = Xnode_V2.objects.filter(connection=connection, xnode_Type="SNODE")
            for child in possible_children:
                if str(child.node_information.get("inode_or_snode_id")) == str(xnode.id):
                    print("Matched child node:", child.id)
                    xnodes_to_update.append(child)
                    break

        # Handle child → parent
        if xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
            parent_id = xnode.node_information.get("inode_or_snode_id")
            if parent_id:
                try:
                    parent_node = Xnode_V2.objects.get(id=parent_id, connection=connection)
                    print("Matched parent node:", parent_node.id)
                    xnodes_to_update.append(parent_node)
                except Xnode_V2.DoesNotExist:
                    print("No parent node found for id:", parent_id)

        #debug logic            
        print("Final nodes to update:")
        for node in xnodes_to_update:
            print("Updating:", node.id, "Type:", node.xnode_Type)

        # Now update flags on all involved nodes
        for node in xnodes_to_update:
            if is_host:
                if node.host_revert_status != 1:
                    node.host_revert_status = 1
            else:
                if node.guest_revert_status != 1:
                    node.guest_revert_status = 1
            node.save(update_fields=["host_revert_status", "guest_revert_status"])

        # If both parties approved, revoke and mark as reverted
        main_node = xnodes_to_update[0]
        if main_node.host_revert_status == 1 and main_node.guest_revert_status == 1 and not main_node.reverted:
            revoke_collateral(
                connection.connection_id,
                [node.id for node in xnodes_to_update],
                host_user.user_id, host_locker.locker_id,
                guest_user.user_id, guest_locker.locker_id,
                is_revert=True
            )

            # Update old notification_type after success
            notif_to_update = None
            for node in xnodes_to_update:
                notif = Notification.objects.filter(
                    target_id=str(node.id),
                    target_type="xnode",
                    connection=connection,
                    notification_type="revert_approval_pending"
                ).order_by("-created_at").first()

                if notif:
                    notif_to_update = notif
                    print(f"Found revert notification for node {node.id}")
                    break

            if notif_to_update:
                notif_to_update.notification_type = "revert_approved_or_rejected"
                notif_to_update.save()
                print("Notification updated.")
            else:
                print("No revert notification found to update.")

            #rest the xnode flag after successfull revert 
            for node in xnodes_to_update:
                # Check if node still exists before trying to save
                if not Xnode_V2.objects.filter(id=node.id).exists():
                    print(f"Node {node.id} was deleted. Skipping save.")
                    continue

                node.host_revert_status = 0
                node.guest_revert_status = 0
                node.save(update_fields=["host_revert_status", "guest_revert_status"])

            return JsonResponse({
                "success": True,
                "message": "Collateral consent successfully reverted."
            })

           # return JsonResponse({"success": True, "message": "Collateral consent has been successfully reverted by both parties."})

        # First revert request → notify the other party
        if (is_host and xnode.guest_revert_status == 0) or (not is_host and xnode.host_revert_status == 0):
            Notification.objects.create(
                connection=connection,
                host_user=target_user,
                guest_user=user,
                host_locker=target_locker,
                guest_locker=user_locker,
                connection_type=connection.connection_type,
                created_at=timezone.now(),
                message=f"User '{user.username}' has requested to withdraw the collateral provided for the consent '{document_name}'. Please review and approve or reject the request.",
                notification_type="revert_approval_pending",
                target_type="xnode",
                target_id=str(xnode.id),
                extra_data={
                    "xnode_id": xnode.id,
                    "connection_id": connection.connection_id,
                    "revert_reason": reason,
                    "resource_name": document_name,
                        "user_details": {
                            "id": user.user_id,
                            "username": user.username,
                            "description": getattr(user, "description", ""),
                            "user_type": getattr(user, "user_type", "user"),
                        },
                }
            )

        waiting_for = guest_user.username if is_host else host_user.username
        return JsonResponse({
            "success": True,
            "message": f"Revert request sent by '{user.username}'. Waiting for approval from '{waiting_for}'."
        })

    # Non-collateral → immediate revert
    print(f"Creating revert for non-collateral: {xnode.id} {connection.connection_id}")
    if share_type == "share":
        revoke_share(connection.connection_id, [xnode.id], host_user.user_id,
                     host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
                     is_revert=True)
    elif share_type == "confer":
        revoke_confer(connection.connection_id, [xnode.id], host_user.user_id,
                      host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
                      is_revert=True)
    # elif share_type == "transfer":
    #     revoke_transfer(...)
    else:
        return JsonResponse({"success": False, "error": f"Unsupported share_type: {share_type}"})

    return JsonResponse({"success": True, "message": f"{share_type.capitalize()} consent reverted successfully."})


@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def reject_revert_consent(request):
    print("Reject Revert Consent Initiated")

    user = request.user
    xnode_id = request.data.get("xnode_id")
    reason = request.data.get("revert_reject_reason", "").strip()

    if not xnode_id :
        return JsonResponse({"success": False, "error": "Missing xnode_id or reason"}, status=400)

    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
    except Xnode_V2.DoesNotExist:
        return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

    connection = xnode.connection
    host_user = connection.host_user
    guest_user = connection.guest_user
    host_locker = connection.host_locker
    guest_locker = connection.guest_locker

    # Determine if the rejector is host or guest
    is_host = (user == host_user)
    user_locker = host_locker if is_host else guest_locker
    target_user = guest_user if is_host else host_user
    target_locker = guest_locker if is_host else host_locker

    if xnode.reverted:
        return JsonResponse({"success": False, "message": "This consent has already been reverted."})

    # Prevent same user from rejecting their own request
    if xnode.host_revert_status == 1 and is_host:
        return JsonResponse({"success": False, "error": "You cannot reject your own revert request."})

    if xnode.guest_revert_status == 1 and not is_host:
        return JsonResponse({"success": False, "error": "You cannot reject your own revert request."})

    # Get document name
    document_name = "Unknown Resource"
    inode = access_Resource(xnode_id=xnode.id)
    if inode:
        try:
            res_id = inode.node_information.get("resource_id")
            resource = Resource.objects.get(resource_id=res_id)
            document_name = resource.document_name
        except:
            pass

    # Prepare list of nodes to update 
    xnodes_to_update = [xnode]  # Always include the request node

    # Handle parent → child
    if xnode.xnode_Type in [Xnode_V2.XnodeType.INODE, Xnode_V2.XnodeType.SNODE]:
        possible_children = Xnode_V2.objects.filter(connection=connection, xnode_Type="SNODE")
        for child in possible_children:
            if str(child.node_information.get("inode_or_snode_id")) == str(xnode.id):
                print("Matched child node:", child.id)
                xnodes_to_update.append(child)
                break

    # Handle child → parent
    if xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
        parent_id = xnode.node_information.get("inode_or_snode_id")
        if parent_id:
            try:
                parent_node = Xnode_V2.objects.get(id=parent_id, connection=connection)
                print("Matched parent node:", parent_node.id)
                xnodes_to_update.append(parent_node)
            except Xnode_V2.DoesNotExist:
                print("No parent node found for id:", parent_id)

    print("Final nodes to update for rejection:")
    for node in xnodes_to_update:
        print("Rejecting:", node.id, "Type:", node.xnode_Type)

    # Clear approval flags (host_revert_status, guest_revert_status) and revert_reason
    for node in xnodes_to_update:
        if is_host:
            node.host_revert_status = 0
            node.guest_revert_status = 0
        else:
            node.guest_revert_status = 0
            node.host_revert_status = 0

        node.save(update_fields=["host_revert_status", "guest_revert_status"])

    # Send notification to the party who originally requested revert
    Notification.objects.create(
        connection=connection,
        host_user=target_user,
        guest_user=user,
        host_locker=target_locker,
        guest_locker=user_locker,
        connection_type=connection.connection_type,
        created_at=timezone.now(),
        message=f"User '{user.username}' has rejected the request to revert the collateral consent for '{document_name}'.",
        notification_type="revert_rejected",
        target_type="xnode",
        target_id=str(xnode.id),
        extra_data={
            "xnode_id": xnode.id,
            "connection_id": connection.connection_id,
            "revert_reject_reason": reason,
            "resource_name": document_name,
            "user_details": {
                            "id": user.user_id,
                            "username": user.username,
                            "description": getattr(user, "description", ""),
                            "user_type": getattr(user, "user_type", "user"),
                        },
        }
    )

    # NOTIFICATION UPDATE AFTER REJECT
    notif_to_update = None
    for node in xnodes_to_update:
        notif = Notification.objects.filter(
            target_id=str(node.id),
            target_type="xnode",
            connection=connection,
            notification_type="revert_approval_pending"
        ).order_by("-created_at").first()

        if notif:
            notif_to_update = notif
            print(f"Found revert notification for node {node.id}")
            break

    if notif_to_update:
        notif_to_update.notification_type = "revert_approved_or_rejected"
        notif_to_update.save()
        print("Notification updated.")
    else:
        print("No revert notification found to update.")

    return JsonResponse({"success": True, "message": "Revert request rejected."})
