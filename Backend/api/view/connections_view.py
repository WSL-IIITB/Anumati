# update_connection_terms
# transfer_resource
# transfer_resource_reverse
# get_user_resources_by_connection_type
# get_All_Xnodes


import json
from django.db import models
from http import HTTPStatus
from django.utils import timezone
from .utils import compute_terms_status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from ..models import (
    Resource,
    Notification,
    Locker,
    CustomUser,
    Connection,
    ConnectionType,
)


from ..model.xnode_model import Xnode_V2
from .resource_management_view import access_Resource

from ..serializers import XnodeV2Serializer, ConnectionSerializer ,ConnectionTypeSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_http_methods

from .resource_management_view import delete_descendants,update_parents

#sachin
@csrf_exempt
@require_http_methods(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource(request):
    try:
        body = json.loads(request.body)

        fields = [
            "connection_name",
            "host_locker_name",
            "guest_locker_name",
            "host_user_username",
            "guest_user_username",
            "validity_until",
        ]

        details = {field: body.get(field) for field in fields}

        if None in details.values():
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        host_user = CustomUser.objects.get(username=details["host_user_username"])
        host_locker = Locker.objects.get(name=details["host_locker_name"], user=host_user)
        guest_user = CustomUser.objects.get(username=details["guest_user_username"])
        guest_locker = Locker.objects.get(name=details["guest_locker_name"], user=guest_user)
        connection = Connection.objects.get(
            connection_name=details["connection_name"],
            guest_locker=guest_locker,
            host_locker=host_locker,
        )

    except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
        return JsonResponse({"success": False, "error": str(e)}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    print("terms_value:", connection.terms_value)
    print("resources:", connection.resources)

    def process_transfer_entries(key: str, value: str, resources, guest_locker, guest_user):
        print(f"Checking key: {key}, value: {value}")

        if not ("|" in value and (value.endswith(";T") or value.endswith("; T"))):
            return None

        try:
            data = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
            parts = data.split("|")

            if len(parts) >= 2:
                xnode_id = parts[1].strip()
                print(f"Extracted Xnode ID: {xnode_id}")

            if any(xnode_id in res for res in resources):
                print(f"Initiating transfer for file: {key} with xnode ID: {xnode_id}")

                # Fetch the original Xnode
                xnode = Xnode_V2.objects.get(id=xnode_id)
                print("--------------------------------")
                new_entry = {
                    "connection": connection.connection_id,
                    "to_locker": host_locker.locker_id,
                    "from_locker": guest_locker.locker_id,
                    "to_user": host_user.user_id,
                    "from_user": guest_user.user_id,
                    "type_of_share": "Transfer",
                    "xnode_id": xnode.id,
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
                node_type = xnode.xnode_Type

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

                # Locate and remove all child VNODEs and SNODEs that belong to the INODE currently being transferred and also send notification to affected user
                if xnode.vnode_list or xnode.snode_list:
                    # Delete all descendants recursively and get the deleted node IDs
                    deleted_node_ids = delete_descendants(xnode)

                    # Clear vnode_list and snode_list in the original node
                    xnode.vnode_list = []
                    xnode.snode_list = []
                    xnode.save(update_fields=["vnode_list", "snode_list"])
                    print(f"Cleared vnode_list and snode_list in original Xnode: {xnode.id}")

                    # Notify affected users based on deleted_node_ids
                    affected_lockers = Locker.objects.filter(xnode_v2__id__in=deleted_node_ids)
                    affected_users = set(locker.user for locker in affected_lockers)

                    notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the original owner transferred the resource."

                    for user in affected_users:
                        user_lockers = affected_lockers.filter(user=user)

                        if not user_lockers.exists():
                            print(f"Warning: No affected lockers found for user {user.username}. Skipping notification.")
                            continue

                        for locker in user_lockers:
                            # Build rich, serializable extra_data for the notification
                            extra_data = {
                                "resource_id": resource.resource_id if resource else None,
                                "resource_name": resource.document_name if resource else None,
                                "locker_id": locker.locker_id,
                                "locker_name": locker.name,
                                "user_id": user.user_id,
                                "username": user.username,
                                "connection_id": connection.connection_id,
                                "connection_name": connection.connection_name,
                            }
                            Notification.objects.create(
                                connection=connection,
                                guest_user=user,
                                host_user=user,
                                guest_locker=guest_locker,
                                host_locker=guest_locker,
                                connection_type=connection.connection_type,
                                created_at=timezone.now(),
                                message=notification_message,
                                notification_type="resource_transferred",
                                target_type="resource",
                                target_id=str(resource.resource_id) if resource else None,
                                extra_data=extra_data,
                            )
                            print(f"Notification sent to {user.username} for affected locker {locker.name}")


                # If VNODE, transfer without lock check
                print("Entering VNODE Transfer Block...")

                if node_type == "VNODE":
                    print("Inside VNODE Transfer Block")
                    print(f"Before Transfer VNODE: {xnode.node_information}")
                    
                    # Modify owner
                    xnode.node_information["current_owner"] = host_user.user_id
                    xnode.locker = host_locker
                    
                    # Print before saving
                    print(f"Before Saving VNODE: {xnode.node_information}")

                    # Save only JSON field
                    # xnode.provenance_stack.insert(0, {"locker": guest_locker.locker_id, "connection": connection.connection_id, "user": guest_user.user_id})
                    xnode.save(update_fields=["node_information", "locker"])
            
                    # Print after saving
                    print(f"After Transfer VNODE: {xnode.node_information}")
                    
                    return True

                # Transfer INODE or SNODE
                if node_type in ["INODE", "SNODE"]:
                    xnode.node_information["primary_owner"] = host_user.user_id
                    xnode.node_information["current_owner"] = host_user.user_id
                    xnode.locker = host_locker
                    # xnode.provenance_stack.insert(0, {"locker": guest_locker.locker_id, "connection": connection.connection_id, "user": guest_user.user_id})
                    xnode.save(update_fields=["node_information", "locker"])

                    # Update is_locked for the node being transferred (`xnode`)
                    if inode and inode.post_conditions:
                        post_conditions = inode.post_conditions
                        is_locked = {}
                        for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                            is_locked[k] = not post_conditions.get(k, False)

                        xnode.is_locked = is_locked
                        xnode.save(update_fields=["is_locked"])
                        print(f"Updated is_locked for transferred Xnode {xnode.id}: {is_locked}")


                    return True

        except (IndexError, ValueError, Xnode_V2.DoesNotExist) as e:
            print(f"Error processing file transfer for {key}: {e}")
            return JsonResponse(
                {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                status=400,
            )

        return None  # Continue checking other entries if no transfer was made
    
    # Start processing all entries
    transferred_any = False
    terms = connection.terms_value or {}
    resources = connection.resources.get("Transfer", [])

    # Process top-level transfer entries
    for key, value in terms.items():
        if key == "canShareMoreData":
            continue
        response = process_transfer_entries(key, value, resources, guest_locker, guest_user)
        if isinstance(response, JsonResponse):
            return response  # Error response, stop
        if response is True:
            transferred_any = True

    # Process nested transfer entries from canShareMoreData
    can_share_more_data = terms.get("canShareMoreData", {})
    for nested_key, nested_value in can_share_more_data.items():
        transferring_value = nested_value.get("enter_value")
        if transferring_value:
            response = process_transfer_entries(nested_key, transferring_value, resources, guest_locker, guest_user)
            if isinstance(response, JsonResponse):
                return response  # Error response, stop
            if response is True:
                transferred_any = True

    # Final response
    if transferred_any:
        return JsonResponse(
            {"success": True, "message": "Resources transferred successfully"},
            status=200,
        )
    else:
        return JsonResponse(
            {"success": False, "error": "No eligible file resource found for transfer"},
            status=400,
        )


    # # **STOP API Execution Immediately on Ownership Check Failure**
    # for key, value in connection.terms_value.items():
    #     response = process_transfer_entries(
    #         key, value, connection.resources.get("Transfer", []),guest_locker, guest_user
    #     )
    #     if isinstance(response, JsonResponse):  # Stop execution immediately
    #         return response  # API Stops Here
    #     if response is True:
    #         return JsonResponse(
    #             {"success": True, "message": "Resource transferred successfully"},
    #             status=200,
    #         )

    # # Process entries within "canShareMoreData" if present
    # can_share_more_data = connection.terms_value.get("canShareMoreData", {})
    # for nested_key, nested_value in can_share_more_data.items():
    #     transferring_value = nested_value.get("enter_value")
    #     if transferring_value:
    #         response = process_transfer_entries(
    #             nested_key,
    #             transferring_value,
    #             connection.resources.get("Transfer", []),guest_locker, guest_user
    #         )
    #         if isinstance(response, JsonResponse) and response.status_code == 403:
    #             return response  # API Stops Here

    # return JsonResponse(
    #     {"success": False, "error": "No eligible file resource found for transfer"},
    #     status=400,
    # )

#sachin
@csrf_exempt
@require_http_methods(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource_reverse(request):
    try:
        body = json.loads(request.body)

        fields = [
            "connection_name",
            "host_locker_name",
            "guest_locker_name",
            "host_user_username",
            "guest_user_username",
            "validity_until",
        ]

        details = {field: body.get(field) for field in fields}

        if None in details.values():
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        host_user = CustomUser.objects.get(username=details["host_user_username"])
        host_locker = Locker.objects.get(name=details["host_locker_name"], user=host_user)
        guest_user = CustomUser.objects.get(username=details["guest_user_username"])
        guest_locker = Locker.objects.get(name=details["guest_locker_name"], user=guest_user)
        connection = Connection.objects.get(
            connection_name=details["connection_name"],
            guest_locker=guest_locker,
            host_locker=host_locker,
        )

    except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
        return JsonResponse({"success": False, "error": str(e)}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    print("terms_value:", connection.terms_value)
    print("resources:", connection.resources)
    host_locker_id = host_locker.locker_id
    host_user_id = host_user.user_id
    def process_transfer_entries(key: str, value: str, resources, host_locker, host_user):
        print(f"Checking key: {key}, value: {value}")

        if not ("|" in value and (value.endswith(";T") or value.endswith("; T"))):
            return None

        try:
            data = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
            parts = data.split("|")

            if len(parts) >= 2:
                xnode_id = parts[1].strip()
                print(f"Extracted Xnode ID: {xnode_id}")

            if any(xnode_id in res for res in resources):
                print(f"Initiating transfer for file: {key} with xnode ID: {xnode_id}")

                # Fetch the original Xnode
                xnode = Xnode_V2.objects.get(id=xnode_id)
                print("--------------------------------")
                new_entry = {
                    "connection": connection.connection_id,
                    "from_locker": host_locker_id,
                    "to_locker": guest_locker.locker_id,
                    "from_user": host_user_id,
                    "to_user": guest_user.user_id,
                    "type_of_share": "Transfer",
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

                node_type = xnode.xnode_Type

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

                # Locate and remove all child VNODEs and SNODEs that belong to the INODE currently being transferred and also send notification to affected user
                if xnode.vnode_list or xnode.snode_list:
                    # Delete all descendants recursively and get the deleted node IDs
                    deleted_node_ids = delete_descendants(xnode)

                    # Clear vnode_list and snode_list in the original node
                    xnode.vnode_list = []
                    xnode.snode_list = []
                    xnode.save(update_fields=["vnode_list", "snode_list"])
                    print(f"Cleared vnode_list and snode_list in original Xnode: {xnode.id}")

                    # Notify affected users based on deleted_node_ids
                    affected_lockers = Locker.objects.filter(xnode_v2__id__in=deleted_node_ids)
                    affected_users = set(locker.user for locker in affected_lockers)

                    notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the original owner transferred the resource."

                    for user in affected_users:
                        user_lockers = affected_lockers.filter(user=user)

                        if not user_lockers.exists():
                            print(f"Warning: No affected lockers found for user {user.username}. Skipping notification.")
                            continue

                        for locker in user_lockers:
                            # Build rich, serializable extra_data for the notification
                            extra_data = {
                                "resource_id": resource.resource_id if resource else None,
                                "resource_name": resource.document_name if resource else None,
                                "locker_id": locker.locker_id,
                                "locker_name": locker.name,
                                "user_id": user.user_id,
                                "username": user.username,
                                "connection_id": connection.connection_id,
                                "connection_name": connection.connection_name,
                            }
                            Notification.objects.create(
                                connection=connection,
                                guest_user=guest_user,
                                host_user=user,
                                guest_locker=guest_locker,
                                host_locker=locker,
                                connection_type=connection.connection_type,
                                created_at=timezone.now(),
                                message=notification_message,
                                notification_type="resource_transferred",
                                target_type="resource",
                                target_id=str(resource.resource_id) if resource else None,
                                extra_data=extra_data,
                            )
                            print(f"Notification sent to {user.username} for affected locker {locker.name}")


                # If VNODE, transfer without lock check
                print("Entering VNODE Transfer Block...")

                if node_type == "VNODE":
                    print("Inside VNODE Transfer Block")
                    print(f"Before Transfer VNODE: {xnode.node_information}")
                    
                    # Modify owner
                    xnode.node_information["current_owner"] = guest_user.user_id
                    xnode.locker = guest_locker
                    
                    # Print before saving
                    print(f"Before Saving VNODE: {xnode.node_information}")

                    # Save only JSON field
                    # xnode.provenance_stack.insert(0, {"locker": host_locker.locker_id, "connection": connection.connection_id, "user": host_user.user_id})
                    xnode.save()
            
                    # Print after saving
                    print(f"After Transfer VNODE: {xnode.node_information}")
                    
                    return True

                # Transfer INODE or SNODE
                if node_type in ["INODE", "SNODE"]:
                    xnode.node_information["primary_owner"] = guest_user.user_id
                    xnode.node_information["current_owner"] = guest_user.user_id
                    xnode.locker = guest_locker
                    # xnode.provenance_stack.insert(0, {"locker": host_locker.locker_id, "connection": connection.connection_id, "user": host_user.user_id})
                    xnode.save()

                    # Update is_locked for the node being transferred (`xnode`)
                    if inode and inode.post_conditions:
                        post_conditions = inode.post_conditions
                        is_locked = {}
                        for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                            is_locked[k] = not post_conditions.get(k, False)

                        xnode.is_locked = is_locked
                        xnode.save(update_fields=["is_locked"])
                        print(f"Updated is_locked for transferred Xnode {xnode.id}: {is_locked}")


                    return True

        except (IndexError, ValueError, Xnode_V2.DoesNotExist) as e:
            print(f"Error processing file transfer for {key}: {e}")
            return JsonResponse(
                {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                status=400,
            )

        return None  # Continue checking other entries if no transfer was made
    
    # Start processing all entries
    transferred_any = False
    terms = connection.terms_value_reverse or {}
    resources = connection.resources.get("Transfer", [])

    # Process top-level transfer entries
    for key, value in terms.items():
        if key == "canShareMoreData":
            continue
        response = process_transfer_entries(key, value, resources, host_locker, host_user)
        if isinstance(response, JsonResponse):
            return response  # Error response, stop
        if response is True:
            transferred_any = True

    # Process nested transfer entries from canShareMoreData
    can_share_more_data = terms.get("canShareMoreData", {})
    for nested_key, nested_value in can_share_more_data.items():
        transferring_value = nested_value.get("enter_value")
        if transferring_value:
            response = process_transfer_entries(nested_key, transferring_value, resources, host_locker, host_user)
            if isinstance(response, JsonResponse):
                return response  # Error response, stop
            if response is True:
                transferred_any = True

    # Final response
    if transferred_any:
        return JsonResponse(
            {"success": True, "message": "Resources transferred successfully"},
            status=200,
        )
    else:
        return JsonResponse(
            {"success": False, "error": "No eligible file resource found for transfer"},
            status=400,
        )


    # # **STOP API Execution Immediately on Ownership Check Failure**
    # for key, value in connection.terms_value_reverse.items():
    #     response = process_transfer_entries(
    #         key, value, connection.resources.get("Transfer", []),guest_locker, guest_user
    #     )
    #     if isinstance(response, JsonResponse):  # Stop execution immediately
    #         return response  # API Stops Here
    #     if response is True:
    #         return JsonResponse(
    #             {"success": True, "message": "Resource transferred successfully"},
    #             status=200,
    #         )

    # # Process entries within "canShareMoreData" if present
    # can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
    # for nested_key, nested_value in can_share_more_data.items():
    #     transferring_value = nested_value.get("enter_value")
    #     if transferring_value:
    #         response = process_transfer_entries(
    #             nested_key,
    #             transferring_value,
    #             connection.resources.get("Transfer", []),guest_locker, guest_user
    #         )
    #         if isinstance(response, JsonResponse) and response.status_code == 403:
    #             return response  # API Stops Here

    # return JsonResponse(
    #     {"success": False, "error": "No eligible file resource found for transfer"},
    #     status=400,
    # )


@csrf_exempt  # Ensure this is on top
@api_view(['GET'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])

def get_All_Xnodes(request: HttpRequest) -> JsonResponse:

    """
    Expected query parameter:
    locker_id: value
    """
    print(f"Authenticated User: {request.user}, Authenticated: {request.user.is_authenticated}")

    locker_id = request.GET.get("locker_id", None)
    if locker_id is None:
        return JsonResponse({"message": "Locker ID cannot be None."}, status=400)

    locker_list = Locker.objects.filter(locker_id=locker_id)
    if locker_list.exists():
        locker = locker_list.first()

        # Determine if the user is the owner of the locker
        is_owner = locker.user == request.user
        
        print(f"Locker Owner: {locker.user}, Request User: {request.user}, Is Owner: {is_owner}")


        xnode_list = Xnode_V2.objects.filter(locker=locker)
        xnode_data_with_resources = []
        print(len(xnode_list))

        for xnode in xnode_list:
            start_inode = access_Resource(xnode_id=xnode.id)
            if start_inode is None:
                return JsonResponse(
                    {
                        "message": f"Starting Inode for Xnode with ID = {xnode.id} does not exist."
                    },
                    status=404,
                )

            try:
                # Fetch the corresponding resource for the inode
                resource = Resource.objects.get(
                    resource_id=start_inode.node_information.get("resource_id")
                )

                

                # Check visibility based on whether the user is the owner or not
                if is_owner or resource.type == "public":


                    resource_name = resource.document_name  # Get the document name

                    # Serialize the Xnode and attach the corresponding resource name
                    xnode_serializer = XnodeV2Serializer(xnode)
                    xnode_data = xnode_serializer.data
                    xnode_data["resource_name"] = (
                        resource_name  # Add the resource name to the Xnode data
                    )

                    xnode_data_with_resources.append(xnode_data)

            except Resource.DoesNotExist:
                return JsonResponse(
                    {"error": f"Resource not found for Xnode ID = {xnode.id}"},
                    status=404,
                )
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse({"xnode_list": xnode_data_with_resources}, status=200)
    else:
        return JsonResponse(
            {"message": f"Locker with ID = {locker_id} does not exist."}, status=404
        )
    
@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_terms(request):
    """
    Updates terms_value or terms_value_reverse independently.

    Request Body:
    {
        "connection_name": "Connection Name",
        "host_locker_name": "Host Locker",
        "guest_locker_name": "Guest Locker",
        "host_user_username": "Host Username",
        "guest_user_username": "Guest Username",
        "terms_value": { ... },  # Optional for Guest-to-Host terms
        "terms_value_reverse": { ... },  # Optional for Host-to-Guest terms
        "resources": { ... }  # Optional resources
    }
    """
    if request.method != "PATCH":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Extract required fields from the request
    connection_name = data.get("connection_name")
    host_locker_name = data.get("host_locker_name")
    guest_locker_name = data.get("guest_locker_name")
    host_user_username = data.get("host_user_username")
    guest_user_username = data.get("guest_user_username")
    connection_terms_json = data.get("terms_value")  # Guest-to-Host terms (optional)
    connection_terms_reverse_json = data.get(
        "terms_value_reverse"
    )  # Host-to-Guest terms (optional)
    resources_json = data.get("resources")  # Optional resources

    # Validate required fields
    if not all(
        [
            connection_name,
            host_locker_name,
            guest_locker_name,
            host_user_username,
            guest_user_username,
        ]
    ):
        return JsonResponse({"error": "All fields are required"}, status=400)

    try:
        # Fetch host and guest users, lockers, and the connection
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
        return JsonResponse({"error": str(e)}, status=404)

    # Helper function to process terms (handles both terms_value and terms_value_reverse)
    def process_terms(terms_json):
        if not terms_json:  # Return an empty dictionary if terms_json is None
            return {}

        processed_terms = {}
        for term_key, term_value in terms_json.items():
            if term_key != "canShareMoreData":
                xnode_from_to = term_value.split(";")[0].strip()
                parts = xnode_from_to.split(",")

                if len(parts) == 4:
                    document_name, xnode_id, from_page, to_page = parts
                    status = term_value.split(";")[-1].strip()
                    try:
                        xnode = Xnode_V2.objects.get(id=xnode_id)
                        processed_terms[term_key] = (
                            f"{document_name}|{xnode_id}; {status}"
                        )
                    except Xnode_V2.DoesNotExist:
                        processed_terms[term_key] = term_value
                else:
                    processed_terms[term_key] = term_value
            else:
                processed_terms[term_key] = term_value
        return processed_terms

    # Process terms_value and terms_value_reverse independently if they are provided
    if connection_terms_json is not None:
        connection.terms_value = process_terms(connection_terms_json)

    if connection_terms_reverse_json is not None:
        connection.terms_value_reverse = process_terms(connection_terms_reverse_json)

    if resources_json is not None:
        connection.resources = resources_json

    connection.save()

    return JsonResponse(
        {"success": True, "message": "Connection terms successfully updated."},
        status=200,
    )

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_details(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_type_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]
        ):
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        try:
            # Fetch host user, locker, guest user, and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)

            # Get the connection type and associated connection
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_locker=host_locker,
                owner_user=host_user,
            )
            connection = Connection.objects.get(
                connection_type=connection_type,
                host_locker=host_locker,
                guest_locker=guest_locker,
                host_user=host_user,
                guest_user=guest_user,
            )

            # Use serializer to serialize connection data
            serializer = ConnectionSerializer(connection)
            connection_data = serializer.data

            # Populate terms_value_reverse explicitly if needed
            if hasattr(connection, "terms_value_reverse"):
                connection_data["terms_value_reverse"] = connection.terms_value_reverse

            return JsonResponse({"connections": connection_data, "post_conditions": connection_type.post_conditions,}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Requested Connection type not found"},
                status=404,
            )
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=400
            )
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@csrf_exempt
@require_http_methods(['GET'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def check_conditions(request):
    """
    Checks if sharing mechanism is possible or not.

    Request Body:
    {
        "connection_id": "Connection ID",
        "type_of_share": "Sharing Mechanism",
        "xnode_id": "Xnode ID"
    }
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    # Extract required fields from the request
    connection_type_id = data.get("connection_type_id")
    type_of_share = data.get("type_of_share")
    xnode_id = data.get("xnode_id")

    # Validate required fields
    if not all(
        [
            connection_type_id,
            type_of_share,
            xnode_id
        ]
    ):
        return JsonResponse({"error": "All fields are required"}, status=400)
    
    try:
        # Fetch host and guest users, lockers, and the connection
        connection_type = ConnectionType.objects.get(id=connection_type_id)
        xnode = Xnode_V2.objects.get(xnode_id=xnode_id)
    except (ConnectionType.DoesNotExist, Xnode_V2.DoesNotExist) as e:
        return JsonResponse({"error": str(e)}, status=404)
    
    if type_of_share == "Share":
        if connection_type.post_conditions["Share"] == True and xnode.post_conditions["Share"] == True:
            return JsonResponse({"possible": True,}, status=200)
        else:  
            return JsonResponse({"possible": False, "message": "Share is not permitted"}, status=200)
    if type_of_share == "Transfer":
        if connection_type.post_conditions["Transfer"] == True:
            if xnode.post_conditions["Transfer"] == True:
                if xnode.node_information["primary_owner"] == xnode.node_information["current_owner"]:
                    return JsonResponse({"possible": True,}, status=200)
                else:
                    return JsonResponse({"possible": False, "message": "Transfer is not permitted"}, status=200)
            else:
                return JsonResponse({"possible": False, "message": "Transfer is not permitted"}, status=200)
        else:
            return JsonResponse({"possible": False, "message": "Transfer is not permitted"}, status=200)
    if type_of_share == "Confer":
        if connection_type.post_conditions["Confer"] == True:
            if xnode.post_conditions["Confer"] == True:
                if xnode.node_information["primary_owner"] == xnode.node_information["current_owner"]:
                    return JsonResponse({"possible": True,}, status=200)
                else:
                    return JsonResponse({"possible": False, "message": "Confer is not permitted"}, status=200)
            else:
                return JsonResponse({"possible": False, "message": "Confer is not permitted"}, status=200)
        else:
            return JsonResponse({"possible": False, "message": "Confer is not permitted"}, status=200)
    if type_of_share == "Collateral":
        if connection_type.post_conditions["Collateral"] == True:
            if xnode.post_conditions["Collateral"] == True:
                if xnode.node_information["primary_owner"] == xnode.node_information["current_owner"]:
                    return JsonResponse({"possible": True,}, status=200)
                else:
                    return JsonResponse({"possible": False, "message": "Collateral is not permitted"}, status=200)
            else:
                return JsonResponse({"possible": False, "message": "Collateral is not permitted"}, status=200)
        else:
            return JsonResponse({"possible": False, "message": "Collateral is not permitted"}, status=200)
        

@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_user_resources_by_connection_type(request):
    """
    Fetch resource names and XNode details for a specific connection type and user.

    Query Parameters:
        - connection_type_id: ID of the connection type to filter.
        - username: Username to filter the resources for.
        -locker_id: locker ID to filter specific locker

    Returns:
        - JsonResponse: A JSON object with the resource names and associated XNode details.
    """
    if request.method != "GET":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    try:
        connection_type_id = request.GET.get("connection_type_id")
        username = request.GET.get("username")
        locker_id = request.GET.get("locker_id")

        if not connection_type_id or not username or not locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_type_id or username or locker_id"},
                status=400,
            )

        # Fetch user by username
        user = CustomUser.objects.filter(username=username).first()
        if not user:
            return JsonResponse(
                {"success": False, "message": "User not found"}, status=404
            )
        
        # Verify the locker exists and belongs to the user
        locker = Locker.objects.filter(locker_id=locker_id).first()
        if not locker:
            return JsonResponse({"success": False, "message": "Locker not found for the given user"}, status=404)


        # Filter connections by locker
        connections = Connection.objects.filter(
            connection_type_id=connection_type_id, guest_user=user, host_locker_id=locker
        ).select_related("connection_type")

        if not connections.exists():
            return JsonResponse(
                {"success": False, "message": "No connections found"}, status=404
            )

        # Prepare response with all XNode details and resource names
        xnode_data_with_resources = []

        for connection in connections:
            # Fetch XNode details related to the connection
            xnodes = Xnode_V2.objects.filter(connection=connection, locker = locker).select_related("connection")

            for xnode in xnodes:
                try:
                    # Get inode information for the XNode
                    start_inode = access_Resource(xnode_id=xnode.id)
                    if start_inode is None:
                        continue  # Skip this XNode if no inode is found

                    # Fetch resource associated with the inode
                    resource = Resource.objects.get(
                        resource_id=start_inode.node_information.get("resource_id")
                    )

                    # Serialize XNode data
                    xnode_serializer = XnodeV2Serializer(xnode)
                    xnode_data = xnode_serializer.data
                    xnode_data["resource_name"] = resource.document_name  # Add resource name
                    xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                    xnode_data_with_resources.append(xnode_data)

                except Resource.DoesNotExist:
                    continue  # Skip this XNode if the resource does not exist
                except Exception as e:
                    return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse(
            {
                "success": True,
                "connection_type_id": connection_type_id,
                "username": username,
                "data": xnode_data_with_resources,
            },
            status=200,
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connection_xnode_details(request):
    """
    Fetch XNode details and associated resource names for a specific outgoing connection.

    Query Parameters:
        - connection_id: ID of the connection to filter.
        - locker_id:locker_id 

    Returns:
        - JsonResponse: A JSON object with XNode details and associated resource names.
    """
    try:
        connection_id = request.GET.get("connection_id")
        locker_id = request.GET.get("locker_id")

        if not connection_id or not locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id or locker_id"}, status=400
            )
        
        locker = Locker.objects.filter(locker_id=locker_id).first()
        if not locker:
            return JsonResponse({"success": False, "message": "Locker not found for the given user"}, status=404)



        # Fetch the connection
        connection = Connection.objects.filter(connection_id=connection_id, guest_locker = locker).select_related("connection_type", "host_user").first()
        
        if not connection:
            return JsonResponse(
                {"success": False, "message": "Connection not found"}, status=404
            )
        

        # Fetch XNodes related to this connection
        xnodes = Xnode_V2.objects.filter(connection=connection, locker = locker).select_related("connection")
        xnode_data_with_resources = []
        print("xnode data with resources",xnode_data_with_resources)

        for xnode in xnodes:
            try:
                # Get inode information for the XNode
                start_inode = access_Resource(xnode_id=xnode.id)
                if start_inode is None:
                    continue  # Skip if no inode is found

                # Fetch resource associated with the inode
                resource = Resource.objects.get(
                    resource_id=start_inode.node_information.get("resource_id")
                )

                # Serialize XNode data
                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name  # Add resource name
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name
                xnode_data_with_resources.append(xnode_data)

            except Resource.DoesNotExist:
                continue  # Skip this XNode if the resource does not exist
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse(
            {
                "success": True,
                "connection_id": connection_id,
                "data": xnode_data_with_resources,
            },
            status=200,
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)




@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
# def check_download_status(request, xnode_id, connection_id):
#     if request.method != "GET":
#         return JsonResponse({"error": "Method not allowed"}, status=405)

#     try:
#         connection = Connection.objects.get(connection_id=connection_id)
#     except Connection.DoesNotExist:
#         return JsonResponse({"error": "Connection not found"}, status=404)

#     connection_type_id = connection.connection_type.connection_type_id  

#     try:
#         connection_type = ConnectionType_V2.objects.get(connection_type_id=connection_type_id)
#     except ConnectionType_V2.DoesNotExist:
#         return JsonResponse({"error": "Connection type not found"}, status=404)

#     try:
#         xnode = Xnode_V2.objects.get(id=xnode_id)
#     except Xnode_V2.DoesNotExist:
#         return JsonResponse({"error": "Xnode not found"}, status=404)

#     node_download_permission = xnode.post_conditions.get("download", False)
#     connection_download_permission = connection_type.post_conditions.get("download", False)
#     can_download = node_download_permission and connection_download_permission

#     return JsonResponse({"canDownload": can_download})

def check_download_status(request, xnode_id, connection_id):
    print(f"Received request for check_download_status with xnode_id={xnode_id}, connection_id={connection_id}")

    if request.method != "GET":
        print("Error: Method not allowed")
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Fetch Connection
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        print(f"Found Connection: {connection}")
    except Connection.DoesNotExist:
        print("Error: Connection not found")
        return JsonResponse({"error": "Connection not found"}, status=404)

    # Get Connection Type ID
    connection_type_id = connection.connection_type.connection_type_id
    print(f"Connection Type ID: {connection_type_id}")

    # Fetch ConnectionType_V2
    try:
        connection_type = ConnectionType.objects.get(connection_type_id=connection_type_id)
        print(f"Found ConnectionType_V2: {connection_type}")
    except ConnectionType.DoesNotExist:
        print("Error: Connection type not found")
        return JsonResponse({"error": "Connection type not found"}, status=404)

    # Fetch Xnode_V2
    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
        print(f"Found Xnode_V2: {xnode}")
    except Xnode_V2.DoesNotExist:
        print("Error: Xnode not found")
        return JsonResponse({"error": "Xnode not found"}, status=404)

    # Debugging permissions
    print(f"xnode post_conditions: {xnode.post_conditions}")
    print(f"connection_type post_conditions: {connection_type.post_conditions}")

    node_download_permission = xnode.post_conditions.get("download", False)
    connection_download_permission = connection_type.post_conditions.get("download", False)

    can_download = node_download_permission and connection_download_permission

    print(f"Download permissions - Node: {node_download_permission}, Connection Type: {connection_download_permission}")
    print(f"Final canDownload value: {can_download}")

    return JsonResponse({"canDownload": can_download})


@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_if_expired(request):
    """
    POST API to check and update connection_status to 'closed' for connections
    where validity_time has passed, based on user_id and locker_id.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        locker_id = data.get("locker_id")

        if not user_id or not locker_id:
            return JsonResponse({"success": False, "error": "Missing user_id or locker_id"}, status=400)

        # Validate user and locker
        user = CustomUser.objects.get(user_id=user_id)
        locker = Locker.objects.get(locker_id=locker_id, user=user)

        # Find matching connections
        now = timezone.now()
        connections = Connection.objects.filter(
            ((models.Q(host_user=user) & models.Q(host_locker=locker)) |
             (models.Q(guest_user=user) & models.Q(guest_locker=locker)))
        )

        updated_connections = []

        for connection in connections:
            if connection.validity_time and now > connection.validity_time:
                if connection.connection_status != "closed":
                    connection.connection_status = "closed"
                    connection.save()
                    updated_connections.append(connection.connection_id)

        return JsonResponse({
            "success": True,
            "updated_connection_ids": updated_connections,
            "total_checked": connections.count()
        })

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Locker.DoesNotExist:
        return JsonResponse({"success": False, "error": "Locker not found for the given user"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
    
    #new api required

@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_if_expired_onlogin(request):
    """
    POST API to check and update connection_status to 'closed' for connections
    where validity_time has passed, based on user_id
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

    try:
        if request.user.is_authenticated:
            user_id=request.user.user_id
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)    


        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        # Find matching connections
        now = timezone.now()
        connections = Connection.objects.filter(
            ((models.Q(host_user_id=user_id)) | (models.Q(guest_user_id=user_id)))
        )

        updated_connections = []

        for connection in connections:
            if connection.validity_time and now > connection.validity_time:
                if connection.connection_status != "closed":
                    connection.connection_status = "closed"
                    connection.save()
                    updated_connections.append(connection.connection_id)

        return JsonResponse({
            "success": True,
            "updated_connection_ids": updated_connections,
            "total_checked": connections.count()
        })

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
        


@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_tolive(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON format."}, status=400
            )

        connection_name = data.get("connection_name")
        host_locker_name = data.get("host_locker_name")
        guest_locker_name = data.get("guest_locker_name")
        host_user_username = data.get("host_user_username")
        guest_user_username = data.get("guest_user_username")

        if not all([
            connection_name,
            host_locker_name,
            guest_locker_name,
            host_user_username,
            guest_user_username,
        ]):
            return JsonResponse(
                {"success": False, "error": "All fields are required."}, status=400
            )

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            guest_user = CustomUser.objects.get(username=guest_user_username)
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=404
            )

        try:
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=404
            )

        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                guest_locker=guest_locker,
                host_user=host_user,
                guest_user=guest_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found."}, status=404
            )
        
       # Don't overwrite if already closed
        if connection.connection_status in ["closed", "revoked"]:
            return JsonResponse({
                "success": True,
                "message": f"Connection is already {connection.connection_status}. No changes made.",
                "status": connection.connection_status,
            })

        terms_value = connection.terms_value or {}
        terms_value_reverse = connection.terms_value_reverse or {}

        summary = compute_terms_status(terms_value)
        summary_reverse = compute_terms_status(terms_value_reverse)

        count_T = summary["count_T"]
        count_F = summary["count_F"]
        count_R = summary["count_R"]

        count_T_rev = summary_reverse["count_T"]
        count_F_rev = summary_reverse["count_F"]
        count_R_rev = summary_reverse["count_R"]

        total_obligations = count_T + count_F + count_R
        total_obligations_rev = count_T_rev + count_F_rev + count_R_rev

        if (
            count_T == total_obligations and count_R == 0 and
            count_T_rev == total_obligations_rev and count_R_rev == 0
        ):
            connection.connection_status = 'live'
        else:
            connection.connection_status = 'established'

        connection.save()

        return JsonResponse({
            "success": True,
            "message": "Connection status updated successfully.",
            "status": connection.connection_status,
            "host_terms_summary": summary,
            "guest_terms_summary": summary_reverse,
        })
    
@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def reject_shared_resource(request):
    try:
        body = json.loads(request.body)

        required_fields = [
            "connection_name",
            "host_locker_name",
            "guest_locker_name",
            "host_user_username",
            "guest_user_username",
            "rejection_reason",
            "resource_name"
        ]

        for field in required_fields:
            if not body.get(field):
                return JsonResponse(
                    {"success": False, "error": f"{field} is required"}, status=400
                )

        # Extract users and lockers
        host_user = CustomUser.objects.get(username=body["host_user_username"])
        guest_user = CustomUser.objects.get(username=body["guest_user_username"])
        host_locker = Locker.objects.get(name=body["host_locker_name"], user=host_user)
        guest_locker = Locker.objects.get(name=body["guest_locker_name"], user=guest_user)
        rejection_reason = body["rejection_reason"]
        resource_name = body["resource_name"]

        # Get connection
        connection = Connection.objects.get(
            connection_name=body["connection_name"],
            host_user=host_user,
            guest_user=guest_user,
            host_locker=host_locker,
            guest_locker=guest_locker,
        )

        if request.user == host_user:
            rejector_role = "Host"
            if (connection.terms_value):
                # Notify guest
                resource = Resource.objects.get(document_name=resource_name)
                # Build rich, serializable extra_data for the notification
                extra_data = {
                    "resource_id": resource.resource_id,
                    "resource_name": resource.document_name,
                    "rejection_reason": rejection_reason,
                    "rejector_role": rejector_role,
                    "guest_user": {
                        "id": guest_user.user_id,
                        "username": guest_user.username,
                        "description": getattr(guest_user, "description", ""),
                        "user_type": getattr(guest_user, "user_type", "user"),
                    },
                    "host_user": {
                        "id": host_user.user_id,
                        "username": host_user.username,
                        "description": getattr(host_user, "description", ""),
                        "user_type": getattr(host_user, "user_type", "user"),
                    },
                    "guest_locker": {
                        "id": guest_locker.locker_id,
                        "name": guest_locker.name,
                        "description": getattr(guest_locker, "description", ""),
                    },
                    "host_locker": {
                        "id": host_locker.locker_id,
                        "name": host_locker.name,
                        "description": getattr(host_locker, "description", ""),
                    },
                    "connection": {
                        "id": connection.connection_id,
                        "name": connection.connection_name,
                    },
                    # "connection_type": {
                    #     "id": connection.connection_type.connection_type_id,
                    #     "name": connection.connection_type.connection_type_name,
                    #     "description": getattr(connection.connection_type, "description", ""),
                    # }
                    "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
                    "connection_info": ConnectionSerializer(connection).data,
                }
                Notification.objects.create(
                    connection=connection,
                    guest_user=guest_user,
                    host_user=guest_user,
                    guest_locker=guest_locker,
                    host_locker=guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=(
                        f"{rejector_role} '{request.user.username}' has rejected the resource '{resource_name}' "
                        f"from the connection '{connection.connection_type}'. Reason: {rejection_reason}"
                    ),
                    notification_type="resource_rejected",
                    target_type="resource",
                    target_id=str(resource.resource_id),
                    extra_data=extra_data,
                )
                return JsonResponse({"success": True, "message": "Rejection notification sent to guest."}, status=200)
            else:
                return JsonResponse({
                    "success": False,
                    "message": "rejection skipped data is approved or pending"
                }, status=200)

        elif request.user == guest_user:
            rejector_role = "Guest"
            if (connection.terms_value_reverse):
                # Notify host
                resource = Resource.objects.get(document_name=resource_name)
                # Build rich, serializable extra_data for the notification
                extra_data = {
                    "resource_id": resource.resource_id,
                    "resource_name": resource.document_name,
                    "rejection_reason": rejection_reason,
                    "rejector_role": rejector_role,
                    "guest_user": {
                        "id": guest_user.user_id,
                        "username": guest_user.username,
                        "description": getattr(guest_user, "description", ""),
                        "user_type": getattr(guest_user, "user_type", "user"),
                    },
                    "host_user": {
                        "id": host_user.user_id,
                        "username": host_user.username,
                        "description": getattr(host_user, "description", ""),
                        "user_type": getattr(host_user, "user_type", "user"),
                    },
                    "guest_locker": {
                        "id": guest_locker.locker_id,
                        "name": guest_locker.name,
                        "description": getattr(guest_locker, "description", ""),
                    },
                    "host_locker": {
                        "id": host_locker.locker_id,
                        "name": host_locker.name,
                        "description": getattr(host_locker, "description", ""),
                    },
                    "connection": {
                        "id": connection.connection_id,
                        "name": connection.connection_name,
                    },
                    # "connection_type": {
                    #     "id": connection.connection_type.connection_type_id,
                    #     "name": connection.connection_type.connection_type_name,
                    #     "description": getattr(connection.connection_type, "description", ""),
                    # }
                    "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
                    "connection_info": ConnectionSerializer(connection).data,
                }
                Notification.objects.create(
                    connection=connection,
                    guest_user=guest_user,
                    host_user=host_user,
                    guest_locker=guest_locker,
                    host_locker=host_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=(
                        f"{rejector_role} '{request.user.username}' has rejected the resource '{resource_name}' "
                        f"from the connection '{connection.connection_type}'. Reason: {rejection_reason}"
                    ),
                    notification_type="resource_rejected",
                    target_type="resource",
                    target_id=str(resource.resource_id),
                    extra_data=extra_data,
                )
                return JsonResponse({"success": True, "message": "Rejection notification sent to host."}, status=200)
            else:
                return JsonResponse({
                    "success": False,
                    "message": "rejection skipped data is approved or pending"
                }, status=200)

        else:
            return JsonResponse({
                "success": False,
                "error": "You are not authorized to reject this request"
            }, status=403)

    except (CustomUser.DoesNotExist, Locker.DoesNotExist, Connection.DoesNotExist) as e:
        return JsonResponse({"success": False, "error": str(e)}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": f"Internal error: {str(e)}"}, status=500)


@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_incoming_connection_resource_shared_by_host_to_guest(request):
    """
    Fetch resources sent by host to guest for a specific connection.

    Query Params:
        - connection_id: ID of the connection
        - user_id: Guest user ID (for validation)
        - locker_id: Guest locker ID (for validation)
    """
    try:
        connection_id = request.GET.get("connection_id")
        guest_user_id = request.GET.get("guest_user_id")
        guest_locker_id = request.GET.get("guest_locker_id")

        if not connection_id or not guest_user_id or not guest_locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id, user_id, or locker_id"},
                status=400,
            )

        host_user = request.user

        # # Validate host locker (optional if needed)
        # host_locker = Locker.objects.filter(user=host_user).first()
        # if not host_locker:
        #     return JsonResponse({"success": False, "message": "Host locker not found"}, status=404)

        # Get guest user
        guest_user = CustomUser.objects.filter(user_id=guest_user_id).first()
        if not guest_user:
            return JsonResponse({"success": False, "message": "Guest user not found"}, status=404)

        # Get connection
        connection = Connection.objects.select_related("guest_user", "guest_locker", "connection_type").filter(
            connection_id=connection_id).first()
        if not connection:
            return JsonResponse({"success": False, "message": "Connection not found"}, status=404)

        if connection.host_user != host_user:
            return JsonResponse({"success": False, "message": "Unauthorized: Not host in this connection"}, status=403)

        if connection.guest_user.user_id != guest_user.user_id or str(connection.guest_locker.locker_id) != str(guest_locker_id):
            return JsonResponse({
                "success": False,
                "message": "Guest user_id or locker_id does not match the connection"
            }, status=400)

        # Fetch xnodes in guest locker (host → guest)
        #xnodes = Xnode_V2.objects.filter(connection=connection, locker=connection.guest_locker)
        try:
            xnodes = Xnode_V2.objects.filter(connection=connection,locker=connection.guest_locker).exclude(creator=connection.guest_user.user_id)
        except Exception as e:
            return JsonResponse({"success": False, "error": f"xnode filter failed: {str(e)}"}, status=500)

        xnode_data_with_resources = []

        for xnode in xnodes:
            try:
                inode = access_Resource(xnode_id=xnode.id)
                if not inode:
                    continue
                resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))

                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name
                xnode_data["shared_to_user"] = connection.guest_user.username
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                xnode_data_with_resources.append(xnode_data)
            except Resource.DoesNotExist:
                continue
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse({
            "success": True,
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_name":connection.connection_type.connection_type_name,
            "shared_to_user": connection.guest_user.username,
            "data": xnode_data_with_resources
        }, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connection_resource_shared_by_guest_to_host(request):
    """
    Fetch resources sent by guest to host for a specific connection.

    Query Params:
        - connection_id: ID of the connection
        - user_id: Host user ID (for validation)
        - locker_id: Host locker ID (for validation)
    """
    try:
        connection_id = request.GET.get("connection_id")
        host_user_id = request.GET.get("host_user_id")
        host_locker_id = request.GET.get("host_locker_id")

        if not connection_id or not host_user_id or not host_locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id, user_id, or locker_id"},
                status=400,
            )

        guest_user = request.user

        # Get host user
        host_user = CustomUser.objects.filter(user_id=host_user_id).first()
        if not host_user:
            return JsonResponse({"success": False, "message": "Host user not found"}, status=404)

        # Get connection
        connection = Connection.objects.select_related("host_user", "host_locker", "connection_type").filter(
            connection_id=connection_id).first()
        if not connection:
            return JsonResponse({"success": False, "message": "Connection not found"}, status=404)

        if connection.guest_user != guest_user:
            return JsonResponse({"success": False, "message": "Unauthorized: Not guest in this connection"}, status=403)

        if connection.host_user.user_id != host_user.user_id or str(connection.host_locker.locker_id) != str(host_locker_id):
            return JsonResponse({
                "success": False,
                "message": "Host user_id or locker_id does not match the connection"
            }, status=400)

        # Fetch xnodes in host locker (guest to host)
        xnodes = Xnode_V2.objects.filter(connection=connection, locker=connection.host_locker).exclude(creator=connection.host_user.user_id)
        xnode_data_with_resources = []

        for xnode in xnodes:
            try:
                inode = access_Resource(xnode_id=xnode.id)
                if not inode:
                    continue
                resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))

                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name
                xnode_data["shared_to_user"] = connection.host_user.username
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                xnode_data_with_resources.append(xnode_data)
            except Resource.DoesNotExist:
                continue
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse({
            "success": True,
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_name":connection.connection_type.connection_type_name,
            "shared_to_user": connection.host_user.username,
            "data": xnode_data_with_resources
        }, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
