# upload_resource
# subset_resource
# update_Xnode_Inode
# delete_update_resource
# access_Resourse
# access_Resource_API
# update_extra_data
# download_resource
# get_total_pages_in_document
# access resource submitted

import os
import json
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.conf import settings
from pypdf import PdfReader,PdfWriter
import shutil
from django.http import FileResponse, Http404

from ..models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from ..model.xnode_model import Xnode_V2
from ..serializers import ResourceSerializer, XnodeV2Serializer
from django.db import models
from django.db.models import Q
from ..serializers import ConnectionSerializer


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def upload_resource(request):
    """
    Creates a resource (file) for a particular locker of the authenticated user and associates it with an Xnode_V2.
    The resource visibility can be public or private.
    """
    if request.method == "POST":
        try:
            # Get form data
            document_name = request.POST.get("resource_name")
            locker_name = request.POST.get("locker_name")
            resource_type = request.POST.get("type")  # Public or Private
            file = request.FILES.get("document")
            validity_time = request.POST.get("validity_time")
            post_conditions = request.POST.get("post_conditions")
 
            if not all(
                [document_name, locker_name, resource_type, file, validity_time, post_conditions]
            ):
                return JsonResponse({"error": "Missing required fields"}, status=400)
            
            post_conditions = json.loads(post_conditions)

            transformed_post_conditions = {
                "creator_conditions": {
                    "download": post_conditions.get("download", True),
                    "share": post_conditions.get("share", True),
                    "confer": post_conditions.get("confer", True),
                    "transfer": post_conditions.get("transfer", True),
                    "collateral": post_conditions.get("collateral", True),
                    "subset": post_conditions.get("subset", True)
                },
                "download": post_conditions.get("download", True),
                "share": post_conditions.get("share", True),
                "confer": post_conditions.get("confer", True),
                "transfer": post_conditions.get("transfer", True),
                "collateral": post_conditions.get("collateral", True),
                "subset": post_conditions.get("subset", True)
            }
            
            parsed_validity_time = parse_datetime(validity_time)
            if parsed_validity_time is None:
                return JsonResponse(
                    {"error": "Invalid validity_time format. Use ISO 8601 (e.g., 2025-01-27T00:00:00)"},
                    status=400,
                )

            # Ensure the datetime is timezone-aware
            parsed_validity_time = make_aware(parsed_validity_time)

            # Check user authentication
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            # Check user authentication
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            user = request.user

            # Get locker
            locker = Locker.objects.get(user=user, name=locker_name)

            # Handle file upload and save it to MEDIA_ROOT/documents/
            relative_path = os.path.join("documents", file.name)
            file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb+") as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            # Create a resource entry in the Resource table
            resource = Resource.objects.create(
                document_name=document_name,
                i_node_pointer=relative_path,
                locker=locker,
                owner=user,
                type=resource_type,  # Visibility stored in the Resource table
                validity_time=parsed_validity_time,
            )
            resource_url = os.path.join(settings.MEDIA_URL, relative_path)
            # print(f"post conditions={serializers.serialize('json', [post_conditions,])}")
            print(f"post conditions={transformed_post_conditions}")
            # Create Xnode_V2 (visibility is not stored here)
            xnode_default = Xnode_V2.objects.create(
                locker=locker,
                created_at=timezone.now(),
                validity_until=parsed_validity_time.isoformat(),
                xnode_Type=Xnode_V2.XnodeType.INODE,
                creator=user.user_id,
                provenance_stack=[],      
                post_conditions = transformed_post_conditions,
                snode_list=[],
                vnode_list=[],
                node_information={
                    "resource_id": resource.resource_id,
                    "method_name": "",
                    "method_params": {},
                    "resourse_link": resource_url,
                    "resource_name": resource.document_name,
                    "primary_owner": resource.owner.user_id,
                    "current_owner": resource.owner.user_id,
                    "remarks": None
                },
            )

            return JsonResponse(
                {
                    "success": True,
                    "document_name": document_name,
                    "type": resource_type,
                    "resource_url": resource_url,
                    "ID_Of_Xnode_Created": xnode_default.id,
                    "validity_until": parsed_validity_time.isoformat(),
                     "primary_owner": {
                        "id":resource.owner.user_id,
                        "username":resource.owner.username
                    },
                    "current_owner": {
                        "id": resource.owner.user_id,
                        "username":resource.owner.username,
                    },
                    # "primary_owner": resource.owner,
                    # "current_owner": resource.owner
                },
                status=201,
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=400
            )
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Owner not found"}, status=400
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

def access_Resource(xnode_id: int) -> Xnode_V2:
    xnode_List = Xnode_V2.objects.filter(id=xnode_id)
    print(xnode_List)
    if xnode_List.exists():
        xnode = xnode_List.first()
        if xnode.xnode_Type == Xnode_V2.XnodeType.INODE:
            return xnode
        elif xnode.xnode_Type == Xnode_V2.XnodeType.VNODE:
            return access_Resource(xnode_id=xnode.node_information["link"])
        elif xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
            return access_Resource(xnode_id=xnode.node_information["inode_or_snode_id"])
    else:
        return None
    

@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_subset_resource(request):
    """
    Creates a new resource from a subset of a PDF and registers it like an uploaded resource.
    
    Request JSON:
    {
        "xnode_id": "<xnode_id>",
        "from_page": from_page INTEGER,
        "to_page": to_page INTEGER,
        "resource_name": "resource name"
    }

    Returns:
    - New Xnode ID for the subset resource.
    """
    try:
        data = request.data
        xnode_id = data.get("xnode_id")
        from_page = data.get("from_page")
        to_page = data.get("to_page")
        resource_name = data.get("resource_name")

        if any(val is None for val in [xnode_id, from_page, to_page, resource_name]):
            return JsonResponse({"error": "Missing required fields"}, status=400)


        if from_page < 1 or to_page < from_page:
            return JsonResponse({"error": "Invalid page range"}, status=400)

        # Fetch original resource
        original_inode = access_Resource(xnode_id=xnode_id)
        if not original_inode:
            return JsonResponse({"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404)

        resource_id = original_inode.node_information.get("resource_id")
        if not resource_id:
            return JsonResponse({"error": "No resource_id found in INODE"}, status=404)

        resource = Resource.objects.get(resource_id=resource_id)
        original_pdf_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer)

        if not os.path.exists(original_pdf_path):
            return JsonResponse({"error": "Original PDF not found"}, status=404)

        # Read the original PDF
        reader = PdfReader(original_pdf_path)
        total_pages = len(reader.pages)

        if to_page > total_pages:
            return JsonResponse({"error": f"Invalid page range. Document has {total_pages} pages."}, status=400)

        if from_page == 1 and to_page == total_pages:
            return JsonResponse({"error": "The selected page range matches the original document."}, status=400)
        
        if Resource.objects.filter(document_name=resource_name, locker=resource.locker).exists():
            return JsonResponse({"error": "A resource with this name already exists in this locker."}, status=400)


        # Create a new PDF with selected pages
        writer = PdfWriter()
        for i in range(from_page - 1, to_page):
            writer.add_page(reader.pages[i])

        
        # Handle file upload and save it to MEDIA_ROOT/documents/
    

        # Naming Convention
        relative_path = os.path.join("documents", f"{resource_name.replace(' ', '_')}.pdf") 
        print("realtive_path", relative_path)
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path) 
        print("file_path", file_path)

        

        # Save the subset PDF
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as output_file:
            writer.write(output_file)

        # Create a new Resource entry
        subset_resource = Resource.objects.create(
            document_name=resource_name,
            i_node_pointer=relative_path,
            locker=resource.locker,
            owner=resource.owner,
            type=resource.type,
            validity_time=resource.validity_time,
        )

        resource_url = os.path.join(settings.MEDIA_URL, relative_path)

        # Create Xnode_V2 (INODE)
        subset_xnode = Xnode_V2.objects.create(
            locker=resource.locker,
            created_at=timezone.now(),
            validity_until=resource.validity_time.isoformat(),
            xnode_Type=Xnode_V2.XnodeType.INODE,
            creator=resource.owner.user_id,
            provenance_stack=[],
            post_conditions=original_inode.post_conditions,
            snode_list=[],
            vnode_list=[],
            node_information={
                "resource_id": subset_resource.resource_id,
                "method_name": "subset",
                "method_params": {},
                "resourse_link": resource_url,
                "resource_name": subset_resource.document_name,
                "primary_owner": subset_resource.owner.user_id,
                "current_owner": subset_resource.owner.user_id
            },
        )

        return JsonResponse(
            {
                "success": True,
                "document_name": resource_name,
                "resource_url": resource_url,
                "ID_Of_Xnode_Created": subset_xnode.id,
                "validity_until": subset_resource.validity_time.isoformat(),
                "primary_owner": {
                    "id": subset_resource.owner.user_id,
                    "username": subset_resource.owner.username
                },
                "current_owner": {
                    "id": subset_resource.owner.user_id,
                    "username": subset_resource.owner.username,
                }
            },
            status=201,
        )

    except Resource.DoesNotExist:
        return JsonResponse({"error": f"Resource with ID {resource_id} not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_Xnode_Inode(request: HttpRequest) -> JsonResponse:
    """
    "xnode_id": value,
    "connection_id": value,
    "validity_until": value
    """
    if request.method == "POST":
        xnode_id = request.POST.get("xnode_id", None)
        connection_id = request.POST.get("connection_id", None)
        validity_until = request.POST.get("validity_until", None)
        if xnode_id is None:
            return JsonResponse({"message": "Xnode ID cannot be None."})
        if connection_id is None:
            return JsonResponse({"message": "Connection ID cannot be None."})
        if validity_until is None:
            return JsonResponse({"message": "Validity until cannot be None."})
        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            try:
                connection = Connection.objects.get(connection_id=connection_id)
                xnode.connection = connection
                xnode.validity_until = validity_until
                xnode.save()
                return JsonResponse(
                    {"message": f"Xnode with ID = {xnode.id} updated successfully."},
                    status=status.HTTP_200_OK,
                )
            except Connection.DoesNotExist:
                return JsonResponse(
                    {"message": f"Connection with ID = {connection_id} does not exist."}
                )
        except Xnode_V2.DoesNotExist:
            return JsonResponse(
                {"message": f"Xnode with ID = {xnode_id} does not exist."}
            )
    else:
        return JsonResponse(
            {"message": f"Request method should be POST but got {request.method}."}
        )

@csrf_exempt
@api_view(["GET", "POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_total_pages_in_document(request):
    """
    This API provides:
    - GET: Returns the total number of pages in a document based on the xnode_id.
    - POST: Validates a given page range (from_page, to_page) against the document's total pages.

    Expected JSON Body for POST:
    {
        "xnode_id": <xnode_id>,
        "from_page": <from_page>,
        "to_page": <to_page>
    }

    GET Parameters:
    - xnode_id: ID of the Xnode to retrieve total pages.

    Returns:
    - Success if pages are valid, or error message if invalid.
    """
    if request.method == "GET":
        try:
            # Extract xnode_id from query parameters
            xnode_id = request.GET.get("xnode_id")
            if not xnode_id:
                return JsonResponse(
                    {"error": "xnode_id is required in query parameters"}, status=400
                )

            # Access the INODE using the provided xnode_id
            start_inode = access_Resource(xnode_id=xnode_id)
            if not start_inode:
                return JsonResponse(
                    {"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404
                )

            # Fetch the resource using the resource_id from the INODE
            resource_id = start_inode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse(
                    {"error": "No resource_id found in INODE"}, status=404
                )

            # Fetch the resource
            resource = Resource.objects.get(resource_id=resource_id)
            pdf_file_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer)
            pdf_file_path = pdf_file_path.replace("\\", "/")

            # Check if the file exists
            if not os.path.exists(pdf_file_path):
                return JsonResponse(
                    {"error": f"File not found for resource_id: {resource_id}"},
                    status=404,
                )

            # Read the PDF and get the number of pages
            with open(pdf_file_path, "rb") as file:
                reader = PdfReader(file)
                total_pages = len(reader.pages)

            return JsonResponse(
                {
                    "success": True,
                    "message": f"The document has {total_pages} pages.",
                    "total_pages": total_pages,
                },
                status=200,
            )

        except Resource.DoesNotExist:
            return JsonResponse(
                {"error": f"Resource with ID {resource_id} not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "POST":
        try:
            # Extract data from the request body
            data = request.data
            xnode_id = data.get("xnode_id")
            from_page = data.get("from_page")
            to_page = data.get("to_page")

            # Check if all required fields are provided
            if not all([xnode_id, from_page, to_page]):
                return JsonResponse(
                    {"error": "All fields (xnode_id, from_page, to_page) are required"},
                    status=400,
                )

            # Convert from_page and to_page to integers (and handle ValueError if they aren't valid integers)
            try:
                from_page = int(from_page)
                to_page = int(to_page)
            except ValueError:
                return JsonResponse(
                    {"error": "from_page and to_page must be valid integers"},
                    status=400,
                )

            # Access the INODE using the provided xnode_id
            start_inode = access_Resource(xnode_id=xnode_id)
            if not start_inode:
                return JsonResponse(
                    {"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404
                )

            # Fetch the resource using the resource_id from the INODE
            resource_id = start_inode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse(
                    {"error": "No resource_id found in INODE"}, status=404
                )

            # Fetch the resource
            resource = Resource.objects.get(resource_id=resource_id)
            pdf_file_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer).replace("\\", "/")

            # Check if the file exists
            if not os.path.exists(pdf_file_path):
                return JsonResponse(
                    {"error": f"File not found for resource_id: {resource_id}"},
                    status=404,
                )

            # Read the PDF and get the number of pages
            with open(pdf_file_path, "rb") as file:
                reader = PdfReader(file)
                total_pages = len(reader.pages)

            # Validate the provided page range
            if from_page < 1 or to_page > total_pages or from_page > to_page:
                return JsonResponse(
                    {
                        "error": f"Invalid page range. Document has {total_pages} pages. Entered range: from_page={from_page}, to_page={to_page}"
                    },
                    status=400,
                )

            return JsonResponse(
                {
                    "success": True,
                    "message": f"Valid page range. Document has {total_pages} pages. Entered range: from_page={from_page}, to_page={to_page}",
                },
                status=200,
            )

        except Resource.DoesNotExist:
            return JsonResponse(
                {"error": f"Resource with ID {resource_id} not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def build_access_path_from_nodes(xnode: Xnode_V2):
    access_path = []
    current_node = xnode

    while current_node:
        parent_xnode_id = None
        if current_node.xnode_Type == "VNODE":
            parent_xnode_id = current_node.node_information.get("link")
        elif current_node.xnode_Type == "SNODE":
            parent_xnode_id = current_node.node_information.get("inode_or_snode_id")
        elif current_node.xnode_Type == "INODE":
            break

        if parent_xnode_id is None:
            break

        try:
            parent_node = Xnode_V2.objects.get(id=parent_xnode_id)
        except Xnode_V2.DoesNotExist:
            break

        conn = current_node.connection

        # Determine from_user_id
        if parent_node.xnode_Type in ["SNODE", "INODE"]:
            from_user_id = parent_node.node_information.get("primary_owner")
        else:
            from_user_id = parent_node.node_information.get("current_owner")

        # Determine to_user_id
        if current_node.xnode_Type in ["SNODE", "INODE"]:
            to_user_id = current_node.node_information.get("primary_owner")
        else:
            to_user_id = current_node.node_information.get("current_owner")

        # Get usernames
        try:
            from_user = CustomUser.objects.get(user_id=from_user_id).username
        except CustomUser.DoesNotExist:
            from_user = "unknown"

        try:
            to_user = CustomUser.objects.get(user_id=to_user_id).username
        except CustomUser.DoesNotExist:
            to_user = "unknown"

        # Get locker names from each node (assumes node has locker FK)
        from_locker = getattr(parent_node.locker, 'name', 'unknown')
        to_locker = getattr(current_node.locker, 'name', 'unknown')

        if conn:
            conn_type = conn.connection_type
        else:
            conn_type = "Direct"

        access_path.append({
            "from_user": from_user,
            "to_user": to_user,
            "from_locker": from_locker,
            "to_locker": to_locker,
            "connection_type": conn_type,
            "via_node_type": current_node.xnode_Type
        })

        current_node = parent_node

    return list(reversed(access_path))


def format_access_path(access_path, accessing_user, resource_name, accessed_locker, final_connection_name):
    message = (
        f"User '{accessing_user}' has accessed the resource '{resource_name}' from locker' {accessed_locker}'"
        f"from the connection' {final_connection_name}'.\n\n"
        f"Access Path:\n"
    )

    for i, step in enumerate(access_path, start=1):
        message += (
            f"{i}. {step['from_user']} (Locker: {step['from_locker']})\n"
            f"   --> shared with {step['to_user']} (Locker: {step['to_locker']}) via \"{step['connection_type']}\"\n\n"
        )

    return message

def is_xnode_approved(connection, xnode_id):
    approved_ids = []

    for terms in filter(None, [connection.terms_value, connection.terms_value_reverse]):
        for key, value in terms.items():
            if not isinstance(value, str) or '|' not in value or ';' not in value:
                continue
            try:
                _, rest = value.split("|")
                x_id, status = rest.split(";")
                if status.strip() == "T":
                    approved_ids.append(x_id)
            except ValueError:
                continue

    return str(xnode_id) in approved_ids


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def access_Resource_API(request: HttpRequest) -> JsonResponse:
    if request.method == "GET":
        xnode_id = request.GET.get("xnode_id", None)

        if xnode_id is None:
            return JsonResponse({"message": "xnode_id cannot be none."})

        xnode_List = Xnode_V2.objects.filter(id=xnode_id)
        if not xnode_List.exists():
            return JsonResponse({"message": f"Xnode with id = {xnode_id} does not exist."})

        xnode = xnode_List.first()

        if xnode.connection is None:
            # Access via direct inode/vnode/snode traversal
            original_Xnode = access_Resource(xnode_id=xnode.id)
            if original_Xnode is None:
                return JsonResponse({
                    "message": f"Starting Xnode with ID = {xnode.id} does not exist."
                })

            try:
                resource_Particular = Resource.objects.get(
                    resource_id=original_Xnode.node_information["resource_id"]
                )
            except Resource.DoesNotExist:
                return JsonResponse({
                    "message": f"Resource with ID = {original_Xnode.node_information.get('resource_id')} does not exist."
                })

            # Generate file URL
            file_url = request.build_absolute_uri(
                os.path.join(settings.MEDIA_URL, resource_Particular.i_node_pointer)
            )

            serializer = XnodeV2Serializer(xnode)
            xnode_data = serializer.data
            xnode_data["resource_name"] = resource_Particular.document_name

            return JsonResponse({
                "xnode": xnode_data,
                "link_To_File": file_url
            })

        else:
            # Access via connection
            connection: Connection = xnode.connection
            if connection.requester_consent is False:
                return JsonResponse({
                    "message": f"The requester consent for the connection associated with Xnode with ID = {xnode_id} is False."
                })

            start_Xnode = access_Resource(xnode_id=xnode_id)
            if start_Xnode is None:
                return JsonResponse({"message": "Starting Inode does not exist."})

            resource_id = start_Xnode.node_information["resource_id"]
            resource_List = Resource.objects.filter(resource_id=resource_id)
            if not resource_List.exists():
                return JsonResponse({"message": f"Resource with ID = {resource_id} does not exist."})

            resource = resource_List.first()
            try:
                path_To_File = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer).replace("\\", "/")
                with open(f"{path_To_File}", "rb") as file:
                    reader = PdfReader(file)
                    writer = PdfWriter()
                    for page in reader.pages:
                        writer.add_page(page)

                    output_pdf_filename = f"{resource.document_name}.pdf"
                    output_pdf_path = os.path.join(settings.MEDIA_ROOT, output_pdf_filename)

                with open(output_pdf_path, "wb") as output_pdf:
                    writer.write(output_pdf)

            except Exception as e:
                return JsonResponse({"error": f"{e}"})

            file_url = request.build_absolute_uri(
                os.path.join(settings.MEDIA_URL, output_pdf_filename)
            )

            xnodeserializer = XnodeV2Serializer(xnode)

            inode = access_Resource(xnode_id=xnode.id)
            resource_name = None

            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    resource_name = resource.document_name
                except Resource.DoesNotExist:
                    resource_name = "Unknown Resource"

            xnode_data = xnodeserializer.data
            xnode_data["resource_name"] = resource_name

            if inode:
                try:
                    resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))
                    inode_owner = resource.owner

                    if request.user != inode_owner:
                        access_path = build_access_path_from_nodes(xnode)
     
                        formatted_path = format_access_path(
                        access_path=access_path,
                        accessing_user=request.user.username,
                        resource_name=resource.document_name,
                        accessed_locker=getattr(xnode.locker, 'name', 'unknown'),
                        final_connection_name=connection.connection_type
                    )
                        message = formatted_path

                        # Build a rich access_path with IDs for clickable links
                        rich_access_path = []
                        for step in access_path:
                            # Get user and locker IDs
                            from_user_obj = CustomUser.objects.filter(username=step['from_user']).first()
                            to_user_obj = CustomUser.objects.filter(username=step['to_user']).first()
                            from_locker_obj = Locker.objects.filter(name=step['from_locker']).first()
                            to_locker_obj = Locker.objects.filter(name=step['to_locker']).first()
                            conn_obj = None
                            if step['connection_type'] != 'Direct':
                                conn_obj = ConnectionType.objects.filter(connection_type_name=step['connection_type']).first()
                            rich_access_path.append({
                                'from_user': step['from_user'],
                                'from_user_id': from_user_obj.user_id if from_user_obj else None,
                                'from_locker': step['from_locker'],
                                'from_locker_id': from_locker_obj.locker_id if from_locker_obj else None,
                                'to_user': step['to_user'],
                                'to_user_id': to_user_obj.user_id if to_user_obj else None,
                                'to_locker': step['to_locker'],
                                'to_locker_id': to_locker_obj.locker_id if to_locker_obj else None,
                                'connection_type': step['connection_type'],
                                'connection_type_id': conn_obj.connection_type_id if conn_obj else None,
                                'via_node_type': step['via_node_type'],
                            })

                        # Defensive: ensure all values in rich_access_path are serializable
                        def make_serializable(val):
                            if hasattr(val, 'pk'):
                                return val.pk
                            if hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, type(None))):
                                return str(val)
                            return val
                        serializable_rich_access_path = []
                        for step in rich_access_path:
                            serializable_step = {k: make_serializable(v) for k, v in step.items()}
                            serializable_rich_access_path.append(serializable_step)

                        serializable_extra_data = {
                            "resource_id": resource.resource_id if resource else None,
                            "resource_name": resource.document_name if resource else None,
                            "guest_user": {
                                "id": request.user.user_id,
                                "username": request.user.username,
                                "description": getattr(request.user, "description", ""),
                                "user_type": getattr(request.user, "user_type", "user"),
                            },
                            "host_user": {
                                "id": inode_owner.user_id,
                                "username": inode_owner.username,
                                "description": getattr(inode_owner, "description", ""),
                                "user_type": getattr(inode_owner, "user_type", "user"),
                            },
                            "guest_locker": {
                                "id": connection.guest_locker.locker_id,
                                "name": connection.guest_locker.name,
                                "description": getattr(connection.guest_locker, "description", ""),
                            },
                            "host_locker": {
                                "id": connection.host_locker.locker_id,
                                "name": connection.host_locker.name,
                                "description": getattr(connection.host_locker, "description", ""),
                            },
                            "connection": {
                                "id": connection.connection_id,
                                "name": connection.connection_name,
                            },
                            "connection_type": {
                                "id": connection.connection_type.connection_type_id,
                                "name": connection.connection_type.connection_type_name,
                                "description": getattr(connection.connection_type, "description", ""),
                            },
                            "access_path": serializable_rich_access_path,
                            "connection_info": ConnectionSerializer(connection).data,
                        }
                        Notification.objects.create(
                            connection=connection,
                            guest_user=request.user,
                            host_user=inode_owner,
                            guest_locker=connection.guest_locker,
                            host_locker=connection.host_locker,
                            connection_type=connection.connection_type,
                            created_at=timezone.now(),
                            message=message,
                            notification_type="resource_accessed",
                            target_type="resource",
                            target_id=str(resource.resource_id),
                            extra_data=serializable_extra_data
                        )

                except Resource.DoesNotExist:
                    pass


            return JsonResponse({
                "xnode": xnode_data,
                "link_To_File": file_url
            })

    else:
        return JsonResponse({"message": f"Expected request method is GET but got {request.method}."})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def access_res_submitted(request: HttpRequest) -> JsonResponse:
    if request.method == "GET":
        xnode_id = request.GET.get("xnode_id", None)
        if xnode_id is None:
            return JsonResponse({"message": "xnode_id cannot be none."})

        xnode_List = Xnode_V2.objects.filter(id=xnode_id)
        if not xnode_List.exists():
            return JsonResponse({"message": f"Xnode with id = {xnode_id} does not exist."})

        xnode = xnode_List.first()

        if xnode.connection is None:
            original_Xnode = access_Resource(xnode_id=xnode.id)
            if original_Xnode is None:
                return JsonResponse({
                    "message": f"Starting Xnode with ID = {xnode.id} does not exist."
                })

            try:
                resource_Particular = Resource.objects.get(
                    resource_id=original_Xnode.node_information["resource_id"]
                )
            except Resource.DoesNotExist:
                return JsonResponse({
                    "message": f"Resource with ID = {original_Xnode.node_information.get('resource_id')} does not exist."
                })

            try:
                resource_Particular.i_node_pointer = resource_Particular.i_node_pointer.replace("\\", "/").replace("'\'", "/")
                path_To_File = os.path.normpath(os.path.join(settings.MEDIA_ROOT, resource_Particular.i_node_pointer))

                with open(f"{path_To_File}", "rb") as file:
                    reader = PdfReader(file)
                    writer = PdfWriter()

                    for page in reader.pages:
                        writer.add_page(page)

                    output_pdf_filename = f"{resource_Particular.document_name}.pdf"
                    output_pdf_path = os.path.join(settings.MEDIA_ROOT, output_pdf_filename)

                    with open(output_pdf_path, "wb") as output_pdf:
                        writer.write(output_pdf)

                    if not os.path.exists(output_pdf_path):
                        return JsonResponse({"error": "Output PDF was not created."})
            except Exception as e:
                return JsonResponse({"error": f"{e}"})

            file_url = request.build_absolute_uri(os.path.join(settings.MEDIA_URL, output_pdf_filename))
            serializer = XnodeV2Serializer(xnode)
            xnode_data = serializer.data
            xnode_data["resource_name"] = resource_Particular.document_name

            return JsonResponse({"xnode": xnode_data, "link_To_File": file_url})

        else:
            connection: Connection = xnode.connection

            if connection.requester_consent is False:
                return JsonResponse({
                    "message": f"The requester consent for the connection associated with Xnode with ID = {xnode_id} is False."
                })

            if connection.validity_time < timezone.now():
                return JsonResponse({
                    "message": f"Connection associated with Xnode with ID = {xnode_id} has expired on {connection.validity_time}."
                })

            start_Xnode = access_Resource(xnode_id=xnode_id)
            if start_Xnode is None:
                return JsonResponse({"message": "Starting Inode does not exist."})

            resource_id = start_Xnode.node_information["resource_id"]
            resource_List = Resource.objects.filter(resource_id=resource_id)

            if not resource_List.exists():
                return JsonResponse({"message": f"Resource with ID = {resource_id} does not exist."})

            resource = resource_List.first()

            try:
                path_To_File = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer)
                with open(f"{path_To_File}", "rb") as file:
                    reader = PdfReader(file)
                    writer = PdfWriter()

                    for page in reader.pages:
                        writer.add_page(page)

                    output_pdf_filename = f"{resource.document_name}.pdf"
                    output_pdf_path = os.path.join(settings.MEDIA_ROOT, output_pdf_filename)

                    with open(output_pdf_path, "wb") as output_pdf:
                        writer.write(output_pdf)

                    if not os.path.exists(output_pdf_path):
                        return JsonResponse({"error": "Output PDF was not created."})
            except Exception as e:
                return JsonResponse({"error": f"{e}"})

            file_url = request.build_absolute_uri(os.path.join(settings.MEDIA_URL, output_pdf_filename))
            serializer = XnodeV2Serializer(xnode)
            xnode_data = serializer.data
            xnode_data["resource_name"] = resource.document_name

            inode = access_Resource(xnode_id=xnode.id)
            if inode:
                try:
                    resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))
                    inode_owner = resource.owner

                    if request.user != inode_owner:
                        access_path = build_access_path_from_nodes(xnode)
 
                        formatted_path = format_access_path(
                        access_path=access_path,
                        accessing_user=request.user.username,
                        resource_name=resource.document_name,
                        accessed_locker=getattr(xnode.locker, 'name', 'unknown'),
                        final_connection_name=connection.connection_type
                    )
                        # message = formatted_path
                        # Check if xnode is approved
                        is_approved = is_xnode_approved(connection, xnode.id)

                        if is_approved:
                            message = formatted_path  # use full access path format
                        else:
                            # show simpler message for verification before approval
                            message = f"User '{request.user.username}' accessed the resource '{resource.document_name}' for verification before approval."


                        # Build a rich access_path with IDs for clickable links
                        rich_access_path = []
                        for step in access_path:
                            # Get user and locker IDs
                            from_user_obj = CustomUser.objects.filter(username=step['from_user']).first()
                            to_user_obj = CustomUser.objects.filter(username=step['to_user']).first()
                            from_locker_obj = Locker.objects.filter(name=step['from_locker']).first()
                            to_locker_obj = Locker.objects.filter(name=step['to_locker']).first()
                            conn_obj = None
                            if step['connection_type'] != 'Direct':
                                conn_obj = ConnectionType.objects.filter(connection_type_name=step['connection_type']).first()
                            rich_access_path.append({
                                'from_user': step['from_user'],
                                'from_user_id': from_user_obj.user_id if from_user_obj else None,
                                'from_locker': step['from_locker'],
                                'from_locker_id': from_locker_obj.locker_id if from_locker_obj else None,
                                'to_user': step['to_user'],
                                'to_user_id': to_user_obj.user_id if to_user_obj else None,
                                'to_locker': step['to_locker'],
                                'to_locker_id': to_locker_obj.locker_id if to_locker_obj else None,
                                'connection_type': step['connection_type'],
                                'connection_type_id': conn_obj.connection_type_id if conn_obj else None,
                                'via_node_type': step['via_node_type'],
                            })

                        # Defensive: ensure all values in rich_access_path are serializable
                        def make_serializable(val):
                            if hasattr(val, 'pk'):
                                return val.pk
                            if hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, type(None))):
                                return str(val)
                            return val
                        serializable_rich_access_path = []
                        for step in rich_access_path:
                            serializable_step = {k: make_serializable(v) for k, v in step.items()}
                            serializable_rich_access_path.append(serializable_step)

                        serializable_extra_data = {
                            "resource_id": resource.resource_id if resource else None,
                            "resource_name": resource.document_name if resource else None,
                            "guest_user": {
                                "id": request.user.user_id,
                                "username": request.user.username,
                                "description": getattr(request.user, "description", ""),
                                "user_type": getattr(request.user, "user_type", "user"),
                            },
                            "host_user": {
                                "id": inode_owner.user_id,
                                "username": inode_owner.username,
                                "description": getattr(inode_owner, "description", ""),
                                "user_type": getattr(inode_owner, "user_type", "user"),
                            },
                            "guest_locker": {
                                "id": connection.guest_locker.locker_id,
                                "name": connection.guest_locker.name,
                                "description": getattr(connection.guest_locker, "description", ""),
                            },
                            "host_locker": {
                                "id": connection.host_locker.locker_id,
                                "name": connection.host_locker.name,
                                "description": getattr(connection.host_locker, "description", ""),
                            },
                            "connection": {
                                "id": connection.connection_id,
                                "name": connection.connection_name,
                            },
                            "connection_type": {
                                "id": connection.connection_type.connection_type_id,
                                "name": connection.connection_type.connection_type_name,
                                "description": getattr(connection.connection_type, "description", ""),
                            },
                            "access_path": serializable_rich_access_path,
                            "connection_info": ConnectionSerializer(connection).data,
                        }

                        serializable_extra_data["access_type"] = "pre_approval" if not is_approved else "post_approval"
                        notification_type = "resource_pre_accessed" if not is_approved else "resource_accessed"

                        Notification.objects.create(
                            connection=connection,
                            guest_user=request.user,
                            host_user=inode_owner,
                            guest_locker=connection.guest_locker,
                            host_locker=connection.host_locker,
                            connection_type=connection.connection_type,
                            created_at=timezone.now(),
                            message=message,
                            notification_type=notification_type,
                            target_type="resource",
                            target_id=str(resource.resource_id),
                            extra_data=serializable_extra_data
                        )

                except Resource.DoesNotExist:
                    pass

            return JsonResponse({
                "xnode": xnode_data,
                "link_To_File": file_url,
            })

    return JsonResponse({"message": f"Expected request method is GET but got {request.method}."})



# This function deletes a node and its descendants recursively
def delete_descendants(xnode):
    """
    Recursively delete all descendant nodes of a given Xnode and update parent node lists.
    """
    delete_xnode_list = []

    # Get all direct children
    child_nodes = Xnode_V2.objects.filter(
        Q(node_information__link=xnode.id) | Q(node_information__inode_or_snode_id=xnode.id)
    )

    for child in child_nodes:
        # **Find other lockers where the child node exists**
        other_lockers = Locker.objects.filter(xnode_v2__id=child.id).exclude(user=xnode.locker.user)

        affected_users = set()
        affected_lockers = set()

        for locker in other_lockers:
            affected_users.add(locker.user)
            affected_lockers.add(locker)

        if affected_users:
            # Get connection info from the child (not from parent)
            connection = getattr(child, "connection", None)
            connection_type = getattr(connection, "connection_type", None) if connection else None

            send_deletion_notification(affected_users, affected_lockers, child, connection, connection_type)

        delete_xnode_list.extend(delete_descendants(child))  # Recursively delete child's descendants

        print(f"Updating parents before deleting Xnode {child.id}")
        update_parents(child)  # Update parent vnode_list first

        delete_xnode_list.append(child.id)  # Add child to deletion list
        print(f"Deleting child Xnode: {child.id} ({child.xnode_Type})")
        child.delete()  # Delete child node

    return delete_xnode_list


def update_parents(xnode, deleting_user=None):
    """
    Updates all parent nodes by removing the deleted Xnode from their vnode_list and snode_list.
    If the parent node loses access to a resource, notify the affected users.
    """
    all_parents = Xnode_V2.objects.all()  # Get all nodes
    filtered_parents = [
        parent for parent in all_parents
        if xnode.id in parent.vnode_list or xnode.id in parent.snode_list
    ]

    for parent in filtered_parents:
        # Remove the deleted node from vnode_list and snode_list
        parent.vnode_list = [vid for vid in parent.vnode_list if vid != xnode.id]
        parent.snode_list = [sid for sid in parent.snode_list if sid != xnode.id]

        parent.save(update_fields=["vnode_list", "snode_list"])  # Update only these fields
        print(f"Updated parent Xnode: {parent.id}, vnode_list: {parent.vnode_list}")

        #  Check if the parent node loses all access
        if not parent.vnode_list and not parent.snode_list:
            # Find affected users (except deleting user)
            affected_users = set()
            affected_lockers = set()

            parent_lockers = Locker.objects.filter(xnode_v2__id=parent.id)
            for locker in parent_lockers:
                if locker.user != deleting_user:  # Skip deleting user
                    affected_users.add(locker.user)
                    affected_lockers.add(locker)

            # Send notification ONLY to affected users (not the deleting user)
            if affected_users:
                send_deletion_notification(affected_users, affected_lockers, parent, deleting_user)

            print(f"Notification sent for parent Xnode {parent.id} losing its resources.")


def send_deletion_notification(users, lockers, xnode, connection=None, connection_type=None):

    """
    Sends notification to users about the deletion of a shared Xnode resource.
    """
    try:
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

        message = f"The resource '{document_name}' ({xnode.xnode_Type}) has been deleted by its original owner. It is no longer accessible."

        for user in users:
            user_lockers = [locker for locker in lockers if locker.user == user]

            for locker in user_lockers:
                # Ensure connection is not None before saving
                if connection is None:
                    print(f"Skipping notification for {user.username} due to missing connection.")
                    continue

                Notification.objects.create(
                    connection=connection,  
                    connection_type=connection_type,  
                    host_user=user,
                    guest_user=user,
                    host_locker=locker,
                    guest_locker=locker,
                    created_at=timezone.now(),
                    message=message,
                    notification_type="resource_deleted",
                    target_type="resource",
                    target_id=str(xnode.id),
                    extra_data={
                        "xnode_id": xnode.id,
                        "xnode_type": xnode.xnode_Type,
                        "resource_name": document_name,
                        "locker_id": locker.locker_id,
                        "locker_name": locker.name,
                        "user_id": user.user_id,
                        "username": user.username,
                        "connection_id": connection.connection_id if connection else None,
                        "connection_name": connection.connection_name if connection else None,
                    }
                )
                print(f"Notification sent to {user.username} for locker {locker.name}")

    except Exception as e:
        print(f"Error while sending notification: {e}")

@csrf_exempt
@api_view(["DELETE", "PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Resource(request: HttpRequest) -> JsonResponse:
    if request.method == "DELETE":
        locker_name = request.data.get("locker_name")
        owner_name = request.data.get("owner_name")
        xnode_id = request.data.get("xnode_id")

        if not locker_name or not owner_name or not xnode_id:
            return JsonResponse({"message": "Locker name, Owner name, and Xnode ID must be provided."}, status=400)

        user: CustomUser = request.user

        try:
            request_User = CustomUser.objects.get(username=owner_name)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": f"User with name = {owner_name} does not exist."}, status=404)

        if request_User != user:
            return JsonResponse({"message": "You are not allowed to delete this resource."}, status=403)

        locker = Locker.objects.filter(name=locker_name, user=request_User).first()
        if not locker:
            return JsonResponse({"message": f"Locker with name '{locker_name}' and user '{owner_name}' does not exist."}, status=404)

        xnode = Xnode_V2.objects.filter(id=xnode_id, locker=locker).first()
        if not xnode:
            return JsonResponse({"message": "Xnode not found."}, status=404)

        # connection = xnode.connection
        # connection_type = connection.connection_type
        connection = getattr(xnode, "connection", None)
        connection_type = getattr(connection, "connection_type", None) if connection else None


        xnode_type = xnode.xnode_Type  # Store type before deletion
        print(f"Initiating deletion for {xnode_type} Xnode: {xnode.id}")

        affected_lockers = Locker.objects.filter(xnode_v2=xnode)
        affected_users = {locker.user for locker in affected_lockers}

        delete_xnode_list = delete_descendants(xnode)

        if xnode_type == Xnode_V2.XnodeType.INODE:
            resource_id = xnode.node_information.get("resource_id")
            if resource_id:
                resource = Resource.objects.filter(resource_id=resource_id).first()
                if resource:
                    print(f"Deleting associated resource: {resource_id}")
                    resource.delete()

        update_parents(xnode)

        if affected_users:
            send_deletion_notification(affected_users, affected_lockers, xnode, connection, connection_type)

        delete_xnode_list.append(xnode.id)
        print(f"Deleting parent Xnode: {xnode.id} ({xnode_type})")
        xnode.delete()

        message = f"Successfully deleted {xnode_type} {xnode_id} and all descendants: {delete_xnode_list}"
        print(message)

        return JsonResponse({"message": message}, status=200)


    elif request.method == "PUT":
        """
        Updates Resource (INODE) or XNode (VNODE, SNODE).

        Expected JSON:
        {
            "locker_name": "locker name",
            "owner_name": "user name",
            "xnode_id": id,
            "new_document_name": "Updated Name" (optional),
            "new_visibility": "public/private" (optional),
            "new_validity_time": "YYYY-MM-DDTHH:MM:SS" (optional),
            "post_conditions": {...} (optional, allowed for INODE, VNODE, SNODE)
        }
        """
        def validate_post_condition_update(creator_conditions, new_post_condition, is_creator):
            if is_creator:
                return True, "Valid update"

            violated_keys = []
            for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                creator_value = creator_conditions.get(key, False)
                new_value = new_post_condition.get(key, False)
                if not creator_value and new_value:
                    violated_keys.append(key)

            if violated_keys:
                keys_str = ", ".join(violated_keys)
                return False, f"You cannot enable the following permissions because the creator has disabled them: {keys_str}."

            return True, "Valid update"


        # Extract Data
        locker_name = request.data.get("locker_name")
        owner_name = request.data.get("owner_name")
        xnode_id = request.data.get("xnode_id")
        new_document_name = request.data.get("new_document_name", None)
        visibility = request.data.get("new_visibility", None)
        new_validity_time = request.data.get("new_validity_time", None)
        new_post_condition = request.data.get("post_conditions", None)

        user: CustomUser = request.user  # Logged-in user
        print(f" Request User: {owner_name}, Logged-in User: {user.username}")

        # Validate Required Fields
        if not locker_name or not owner_name or not xnode_id:
            return JsonResponse(
                {"message": "Fields 'locker_name', 'owner_name', and 'xnode_id' are required."},
                status=400,
            )

        # Validate Owner
        try:
            request_User = CustomUser.objects.get(username=owner_name)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": f"User '{owner_name}' does not exist."}, status=404)

        # Permission Check
        if request_User != user:
            return JsonResponse({"message": "You are not authorized to update this resource."}, status=403)

        # Fetch Locker
        try:
            locker = Locker.objects.get(name=locker_name, user=request_User)
            print(f" Locker found: {locker.name}")
        except Locker.DoesNotExist:
            return JsonResponse(
                {"message": f"Locker '{locker_name}' does not exist for user '{owner_name}'."},
                status=404,
            )

        #Fetch XNode
        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            xnode_type = xnode.xnode_Type
            print(f"XNode found: ID={xnode.id}, Type={xnode_type}")
        except Xnode_V2.DoesNotExist:
            return JsonResponse({"message": f"XNode with ID '{xnode_id}' does not exist."}, status=404)

        # Determine if User is Creator
        is_creator = (xnode.creator == user.user_id)
        print("creator", xnode.creator)
        print("user", user.user_id)
        print("is_creator", is_creator)

        # INODE Handling
        if xnode_type == Xnode_V2.XnodeType.INODE:
            if not isinstance(xnode.node_information, dict):
                return JsonResponse({"message": "XNode node_information is missing or invalid."}, status=400)

            resource_id = xnode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse({"message": "XNode does not contain a valid resource_id."}, status=400)

            try:
                resource_To_Be_Updated = Resource.objects.get(resource_id=resource_id)
                print(f"Resource found: {resource_To_Be_Updated.resource_id}")

                # Update fields if provided
                resource_To_Be_Updated.document_name = new_document_name or resource_To_Be_Updated.document_name
                resource_To_Be_Updated.type = visibility or resource_To_Be_Updated.type
                resource_To_Be_Updated.validity_time = new_validity_time or resource_To_Be_Updated.validity_time
                resource_To_Be_Updated.save()
                print("Resource updated successfully!")

                # Handle post_conditions if provided
                if new_post_condition is not None:
                    creator_conditions = xnode.post_conditions.get("creator_conditions", {})
                    is_valid, message = validate_post_condition_update(creator_conditions, new_post_condition, is_creator)
                    if not is_valid:
                        return JsonResponse({"message": message}, status=403)

                    # Update post_condition keys
                    for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        xnode.post_conditions[key] = new_post_condition.get(key, xnode.post_conditions.get(key))

                    # Update creator_conditions if user is creator
                    if is_creator:
                        if "creator_conditions" not in xnode.post_conditions:
                            xnode.post_conditions["creator_conditions"] = {}
                        for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                            xnode.post_conditions["creator_conditions"][key] = new_post_condition.get(key, xnode.post_conditions["creator_conditions"].get(key, False))

                    xnode.save()
                    print(" XNode post_conditions updated successfully!")

                return JsonResponse({"message": "Resource & XNode post_conditions updated successfully."})

            except Resource.DoesNotExist:
                return JsonResponse(
                    {"message": f"Resource with ID '{resource_id}' does not exist."},
                    status=404,
                )

        # VNODE / SNODE Handling
        elif xnode_type in [Xnode_V2.XnodeType.VNODE, Xnode_V2.XnodeType.SNODE]:
            if new_post_condition is None:
                return JsonResponse(
                    {"message": "post_conditions is required for VNODE/SNODE updates."},
                    status=400,
                )

            creator_conditions = xnode.post_conditions.get("creator_conditions", {})
            is_valid, message = validate_post_condition_update(creator_conditions, new_post_condition, is_creator)
            if not is_valid:
                return JsonResponse({"message": message}, status=403)

            for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                xnode.post_conditions[key] = new_post_condition.get(key, xnode.post_conditions.get(key))

            if is_creator:
                if "creator_conditions" not in xnode.post_conditions:
                    xnode.post_conditions["creator_conditions"] = {}
                for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                    xnode.post_conditions["creator_conditions"][key] = new_post_condition.get(key, xnode.post_conditions["creator_conditions"].get(key, False))

            xnode.save()
            print("XNode post_conditions updated successfully!")

            return JsonResponse({"message": "XNode post_conditions updated successfully."})

        else:
            return JsonResponse({"message": f"Unknown XNode Type '{xnode_type}'."}, status=400)


@csrf_exempt
@api_view(["GET", "PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def consent_artifact_view_update(request: HttpRequest) -> JsonResponse:
    """
    GET: Retrieve Xnode details by passing xnode_id as a query parameter.
    POST: Create a new Xnode based on modifications to an existing Xnode.
    """
    if request.method == "GET":
        xnode_id = request.GET.get("xnode_id", None)

        if not xnode_id or xnode_id == "undefined":
            return JsonResponse({
                "success": False,
                "message": "There is no data currently available for viewing."
            }, status=200)

        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            serializer = XnodeV2Serializer(xnode)
            return JsonResponse({"success":True,"xnode": serializer.data}, status=200)
        except Xnode_V2.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "This data has been removed or is no longer accessible."
            }, status=404)
    
    elif request.method == 'PATCH':
        try:
            body = json.loads(request.body)
            xnode_id = body.get("xnode_id")
            post_conditions = body.get("post_conditions")
            new_validity = body.get("new_validity")
            remarks = body.get("remarks")
    
            if not xnode_id or not post_conditions:
                return JsonResponse({'message': 'Both Xnode Id and post conditions are required'}, status=400)
            
            xnode = Xnode_V2.objects.get(id=xnode_id)
            owner_id = None

            if xnode.xnode_Type == 'VNODE':
                owner_id = xnode.node_information['current_owner']
            else:
                owner_id = xnode.node_information['primary_owner']

            if request.user.user_id != owner_id:
                return JsonResponse({'message': 'Not authorized to make changes'}, status=401)
            
            for field in post_conditions:
                if xnode.is_locked[field] and owner_id != xnode.creator:
                    raise Exception("Changes not allowed in this field")
                xnode.post_conditions[field] = post_conditions[field]

            # update validity_until if provided
            if new_validity:
                xnode.validity_until = new_validity

            # store remarks inside node_information if provided
            if remarks is not None:
                node_info = xnode.node_information
                node_info['remarks'] = remarks
                xnode.node_information = node_info  # reassign updated dict

            xnode.save()

            return JsonResponse({'message': 'Consent Artefact Updated successfully'}, status=200)
        
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format."}, status=400)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method."}, status=405)

@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_extra_data(request):
    """
    Append extra data under 'canShareMoreData' for a specific connection with additional fields such as:
    'labelName', 'enter_value' (file), 'purpose', and 'typeOfShare'.
    """
    if request.method == "PATCH":
        data = request.data

        connection_name = data.get("connection_name")
        host_locker_name = data.get("host_locker_name")
        guest_locker_name = data.get("guest_locker_name")
        host_user_username = data.get("host_user_username")
        guest_user_username = data.get("guest_user_username")
        extra_data = data.get("extra_data")

        if not all(
            [
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                extra_data,
            ]
        ):
            return JsonResponse({"error": "All fields are required"}, status=400)

        try:
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
            return JsonResponse({"error": str(e)}, status=404)

        # Determine the user's role and set the appropriate data
        request_user = request.user

        if request_user == host_user:
            can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        elif request_user == guest_user:
            can_share_more_data = connection.terms_value.get("canShareMoreData", {})
        else:
            return JsonResponse({"error": "Invalid user"}, status=400)

        # Process and append extra data to 'canShareMoreData'
        for item in extra_data:
            label_name = item.get("labelName")
            enter_value = item.get("enter_value")  # Expecting a resource or file
            purpose = item.get("purpose")
            type_of_share = item.get("typeOfShare")  # New field for type of share

            if not all([label_name, enter_value, purpose, type_of_share]):
                return JsonResponse(
                    {
                        "error": "All fields in extra_data (labelName, enter_value, purpose, typeOfShare) are required"
                    },
                    status=400,
                )

            # Ensure the enter_value is in the correct format
            try:
                # document_info = enter_value.split(";")[0].strip()  # Extract the file information
                # document_name = document_info.split("|")[0]
                # xnode_id = document_info.split("|")[1].split(",")[0].strip()

                # from_to_str = document_info.split("|")[1].split(",")[1].strip()
                # from_page = int(from_to_str.split(":")[0].replace("(", "").strip())
                # to_page = int(from_to_str.split(":")[1].replace(")", "").strip())

                document_info = enter_value.split(";")[0].strip()  # Extract the file information
                document_name, xnode_id = document_info.split("|")[:2]

                # Fetch the Xnode to ensure it exists
                xnode = Xnode_V2.objects.get(id=xnode_id)

                # Append the extra data in the desired format for file
                can_share_more_data[label_name] = {
                    "enter_value": f"{document_name}|{xnode_id}",
                    "purpose": purpose,
                    "typeOfShare": type_of_share,
                }

            except (ValueError, Xnode_V2.DoesNotExist) as e:
                return JsonResponse(
                    {"error": f"Invalid data for label {label_name}: {str(e)}"},
                    status=400,
                )

        # Save the updated data
        if request_user == host_user:
            updated_terms_value_reverse = connection.terms_value_reverse
            updated_terms_value_reverse["canShareMoreData"] = can_share_more_data
            connection.terms_value_reverse = updated_terms_value_reverse
        elif request_user == guest_user:
            updated_terms_value = connection.terms_value
            updated_terms_value["canShareMoreData"] = can_share_more_data
            connection.terms_value = updated_terms_value

        connection.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Extra data successfully appended.",
                "terms_value": connection.terms_value,
                "terms_value_reverse": connection.terms_value_reverse,
            },
            status=200,
        )

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def xnode_v2_status(request):
    if request.method!="POST":
        return JsonResponse({"success":False,"error":"Invalid request method"},status=405)
    try:
        if request.user.is_authenticated:
            user_id=request.user.user_id
        else:
            return JsonResponse({"error":"user not authenticated"},status=401)
        
        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        now=timezone.now()
        lockers=Locker.objects.filter(user_id=user_id)
        updated_xnodes=[]
        for locker in lockers:
            locker_id=locker.locker_id
            xnodes=Xnode_V2.objects.filter(locker_id=locker_id)
            for xnode in xnodes:
                if xnode.validity_until and now>xnode.validity_until and xnode.status!="closed":
                    xnode.status="closed"
                    xnode.save()
                    updated_xnodes.append(xnode.id)

        return JsonResponse({
            "success": True,
            "updated_xnode_ids": updated_xnodes,
            "total_checked": xnodes.count()
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)            



@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def download_resource(request):
    if request.method != 'GET':
        return JsonResponse({"success":False,"error":"Invalid request method"},status=405)
    try:
        user_id=request.user.user_id

        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        #body = json.loads(request.body)
        xnode_id = request.GET.get("xnode_id")

        if not xnode_id:
            return JsonResponse({'success': False, 'error': 'Missing Xnode ID'}, status=400)

        xnode = Xnode_V2.objects.get(id=xnode_id)

        if xnode.xnode_Type == 'VNODE':
            return JsonResponse({'success': "Cannot download using VNode"}, status=400)
        
        if xnode.is_locked['download']:
            return JsonResponse({'success': False, 'error': 'Download has been disabled'}, status=402)

        if xnode.node_information['primary_owner'] != user_id:
            return JsonResponse({'success': False, 'error' : 'Only Primary owner can download'}, status=402)

        while xnode.xnode_Type == 'SNODE':
            xnode = Xnode_V2.objects.get(id=xnode.node_information['inode_or_snode_id'])


        # file_path = os.path.join(os.getcwd(), xnode.node_information['resourse_link'])
        # print("Looking for file at:", file_path)

        media_relative_path = xnode.node_information['resourse_link']

        # Strip leading '/media/' or 'media/' from stored path
        if media_relative_path.startswith(settings.MEDIA_URL):
            media_relative_path = media_relative_path[len(settings.MEDIA_URL):]

        # Now join with MEDIA_ROOT
        file_path = os.path.join(settings.MEDIA_ROOT, media_relative_path)

        # Normalize path 
        file_path = os.path.normpath(file_path)


        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True)
        else:
            raise Http404("File not found.")

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500) 