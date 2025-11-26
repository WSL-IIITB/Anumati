import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from django.utils.timezone import now
from django.utils.timezone import make_aware
import shutil
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    ResourceSerializer,
    ConnectionTypeSerializer,
    ConnectionSerializer,
    ConnectionType,
    ConnectionTermsSerializer,
    ConnectionFilterSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    GlobalConnectionTypeTemplatePostSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    ConnectionTypeRegulationLinkTablePostSerializer,
    
)
from .models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
    Notification,
)
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime
from datetime import datetime
from collections import defaultdict
from pypdf import PdfReader, PdfWriter
from IPython.display import FileLink
from django.db.models import Q
#for getting the stats of users for consent dashboard
from django.http import JsonResponse
from .models import CustomUser, Connection
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import BasicAuthentication

#Getting the stats of users for consent dashboard 
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_status(request):
    """
    Fetches statistics about the authenticated user's total connections,
    live connections, and closed connections
    """
    user = request.user

    #Incoming: Where the user is the host
    incoming = Connection.objects.filter(host_user=user)
    incoming_total = incoming.count()
    incoming_live = incoming.filter(connection_status="live").count()
    incoming_established = incoming.filter(connection_status="established").count()
    incoming_closed = incoming.filter(connection_status="closed").count()
    total_connection_types = ConnectionType.objects.filter(owner_user=user).count()

    #Outgoing: Where the user is the guest
    outgoing = Connection.objects.filter(guest_user=user)
    outgoing_total=outgoing.count()
    outgoing_live=outgoing.filter(connection_status="live").count()
    outgoing_established=outgoing.filter(connection_status="established").count()
    outgoing_closed=outgoing.filter(connection_status="closed").count()
    
    
    #total_connections = user_connections.count()
    #live_connections = user_connections.filter(connection_status="live").count()
    #closed_connections = user_connections.filter(connection_status="closed").count()
    #established_connections = user_connections.filter(connection_status="established").count()

    stats = {
        "incoming":{
            "total_Users": incoming_total,
            "live": incoming_live,
            "established": incoming_established,
            "closed": incoming_closed,
            "total_connections_type": total_connection_types,
        },
        "outgoing":{
            "total_Connections": outgoing_total,
            "live": outgoing_live,
            "established": outgoing_established,
            "closed": outgoing_closed,
        }
    }
    return JsonResponse(stats, status=200)


@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    """
    View to download a resource by its ID.

    Parameters:
    - request: HttpRequest object containing metadata about the request.
    - resource_id: ID of the resource to be downloaded.

    Returns:
    - FileResponse: The file to be downloaded.
    - JsonResponse: A JSON object with an error message if the resource is not found or not accessible.
    """
    try:
        resource = get_object_or_404(Resource, resource_id=resource_id)

        # Assume resource.i_node_pointer stores the relative path, e.g., 'documents/hk_admissions.pdf'
        relative_path = resource.i_node_pointer
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        file_path = file_path.replace("\\", "/") # Ensure the path is in the correct format for the OS
        print(f"Trying to access file at: {file_path}")

        if os.path.exists(file_path):
            response = FileResponse(
                open(file_path, "rb"),
                as_attachment=True,
                filename=os.path.basename(file_path),
            )
            return response
        else:
            print(f"File not found at: {file_path}")
            return JsonResponse({"error": "File not found."}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_locker(request):
    """
    Creates a locker associated with the logged-in user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Body:
    - name : The name of the new locker.
    - description (optional): The description of the new locker.

    Returns:
    - JsonResponse: A JSON object containing the new locker id, its name and description or an error message.

    Response Codes:
    - 201: Successfully created a resource (locker) at the backend.
    - 400: The data sent in the request is invalid, missing or malformed.
    - 401: The user is not authenticated.
    - 405: Request method not allowed (if not POST).
    """
    if request.method == "POST":
        try:
            locker_name = request.POST.get("name")
            description = request.POST.get("description", "")

            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Name is required"}, status=400
                )

            user = request.user

            # Check if a locker with the same name already exists for this user
            if Locker.objects.filter(name=locker_name, user=user).exists():
                return JsonResponse(
                    {"success": False, "error": "Locker with this name already exists"},
                    status=400,
                )

            # Create the locker
            locker = Locker.objects.create(
                name=locker_name, description=description, user=user
            )
            return JsonResponse(
                {
                    "success": True,
                    "id": locker.locker_id,
                    "name": locker.name,
                    "description": locker.description,
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_lockers_user(request):
    """
    Retrieve lockers associated with a specific user or the authenticated user.

    This view handles GET requests to fetch lockers either for a specific user,
    identified by a 'username' query parameter, or for the authenticated user
    if no username is provided.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username (optional): The username of the user whose lockers are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of lockers.
        - 401: User is not authenticated.
        - 404: Specified user not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            username = request.GET.get("username")
            if username:
                try:
                    user = CustomUser.objects.get(
                        username=username
                    )  # Fetch user by username
                except CustomUser.DoesNotExist:
                    return JsonResponse({"error": "User not found"}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user  # Use the authenticated user
                else:
                    return JsonResponse({"error": "User not authenticated"}, status=401)
            lockers = Locker.objects.filter(user=user)

            # If the current user does not have any existing lockers.
            if not lockers.exists():
                return JsonResponse(
                    {"success": False, "message": "No lockers found for this user"},
                    status=404,
                )

            serializer = LockerSerializer(lockers, many=True)
            return JsonResponse(
                {"success": True, "lockers": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_public_resources(request):
    """
    Retrieve all public resources of the guest_user and guest_locker the logged user views.

    This view uses GET request to fetch all resources of guest_user under a specific guest_locker
    whose visibility is marked as "public". Every user should get access to other user's lockers only
    if the current user is authenticated

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username : username of the target_user that the authenticated user is viewing
        - locker_name : locker_name of the viewed user's locker

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of public resources.
        - 400: Specified user or locker not found.
        - 404: No public resources found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            username = request.GET.get("username")
            locker_name = request.GET.get("locker_name")
            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )
            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Locker Name is required"}, status=400
                )

            try:
                random_user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

            try:
                random_user_locker = Locker.objects.get(
                    user=random_user, name=locker_name
                )
            except Locker.DoesNotExist:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Locker not found for the given username",
                    },
                    status=404,
                )

            public_resources = Resource.objects.filter(
                owner=random_user, type="public", locker=random_user_locker
            )
            if not public_resources.exists():
                return JsonResponse(
                    {"success": False, "message": "No public resources found"},
                    status=404,
                )
            serializer = ResourceSerializer(public_resources, many=True)
            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request"}, status=405)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type(request):
    """
    Retrieve all connection types of the authenticated user.

    This view uses the GET method through which exisitng connection types of the authenticated user is seen.
    Connection types are listed out in the admin view of the user.

     Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username of the authenticated user.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of connection types.
        - 404: No connection types found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            user = request.user
            connection_types = ConnectionType.objects.all()

            user_connection_type = connection_types.filter(owner_user=user)

            if not user_connection_type.exists():
                return JsonResponse(
                    {"success": False, "message": "No connection types"}, status=404
                )

            serializer = ConnectionTypeSerializer(user_connection_type, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def dpi_directory(request):
    """ "
    Retrieve all users present in the DPI Directory.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful retrieval of users.
       - 404: No users are found.
       - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        users = CustomUser.objects.all()
        if not users.exists():
            return JsonResponse(
                {"success": False, "message": "No Users are present."}, status=404
            )

        serializer = UserSerializer(users, many=True)
        return JsonResponse({"success": True, "users": serializer.data}, status=200)
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_other_connection_types(request):
    """
    Retrieve all the connection types of guest_locker of the guest_user that the authenticated user
    does not have a connection with.

    This view uses GET request to fetch all connection types of the current user
    (refering to the guest_user_id and guest_locker_id). Further, the values of guest_user/host_user
    and guest_locker/host_locker is compared with guest_user_id and guest_locker_id, each. If a match is found,
    that connection gets fetched.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - guest_username
        - guest_locker_name

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful connetion_types of users.
       - 400: No connections types are found.
       - 404: User not found / Locker not found.
       - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":

        if request.user.is_authenticated:
            current_user = request.user  # Use the authenticated user
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        try:
            guest_username = request.GET.get("guest_username")
            guest_locker_name = request.GET.get("guest_locker_name")
            guest_user = CustomUser.objects.get(
                username=guest_username
            )  # Fetch user by username
            guest_locker = Locker.objects.get(
                name=guest_locker_name, user=guest_user
            )  # Fetch locker by lockername
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Locker not found for the specified username",
                },
                status=404,
            )

        # This is for Rohith viewing IIITB's Transcripts Locker. Fetch all the connection types of
        # IIITB's Transcripts Locker. Fetch, these connection types' connection ids.

        connection_types_iiitb_transcripts_ids = ConnectionType.objects.filter(
            owner_user=guest_user, owner_locker=guest_locker
        ).values_list("connection_type_id", flat=True)

        if not connection_types_iiitb_transcripts_ids:
            return JsonResponse(
                {"success": False, "message": "No connection types found"}, status=404
            )

        # Now fetch, all the connections where Rohith is either the host_user or guest_user. (Or more formally, it
        # would be the current authenticated user)

        rohith_connections = Connection.objects.filter(
           
        Q(
            (Q(host_user=current_user) | Q(guest_user=current_user)) &
            ~Q(connection_status="closed")
        ))

        rohith_connection_type_ids = rohith_connections.values_list(
            "connection_type_id", flat=True
        ).distinct()

        # Converting QuerySets to sets, for finding easy set difference.
        rohith_connection_type_ids_set = set(rohith_connection_type_ids)
        connection_types_iiitb_transcripts_set = set(
            connection_types_iiitb_transcripts_ids
        )

        # So finally, the list of connection type ids that Rohith has not yet initiated a connection to, with
        # IIITB's Transcripts locker are :
        difference_ids_set = (
            connection_types_iiitb_transcripts_set - rohith_connection_type_ids_set
        )

        if not difference_ids_set:
            return JsonResponse(
                {
                    "success": False,
                    "message": "No other connection types to connect to.",
                },
                status=404,
            )

        difference_connection_types = ConnectionType.objects.filter(
            connection_type_id__in=difference_ids_set
        )
        serializer = ConnectionTypeSerializer(difference_connection_types, many=True)

        return JsonResponse(
            {"success": True, "connection_types": serializer.data}, status=200
        )
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type_by_user_by_locker(request):
    """
    Retrieve connection types by locker and user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Query Parameters:
    - username: The username of the user.
    - locker_name: The name of the locker.

    Returns:
    - JsonResponse: A JSON object containing a list of connection types or an error message.

    Response Codes:
    - 200: Successful retrieval of connection types.
    - 404: Specified user or locker not found.
    - 405: Request method not allowed (if not GET).
    - 400: Bad request (missing parameters).
    """
    if request.method == "GET":
        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")

        if not locker_name:
            return JsonResponse(
                {"success": False, "error": "Locker name is required"}, status=400
            )

        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    return JsonResponse(
                        {"success": False, "error": "User not found"}, status=404
                    )
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            try:
                locker = Locker.objects.get(name=locker_name, user=user)
            except Locker.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            connection_types = ConnectionType.objects.filter(
                owner_user=user, owner_locker=locker
            )

            if not connection_types.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No connection types found for this user and locker",
                    },
                    status=404,
                )

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type_by_user(request):
    """
    Retrieve connection types for the authenticated user.

    Returns:
    - JsonResponse: A list of connection types associated with the authenticated user.
    """
    if request.method == "GET":
        try:
            user = request.user  # 🔐 Authenticated user from BasicAuthentication

            connection_types = ConnectionType.objects.filter(owner_user=user)

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No connection types found for this user"},
                    status=404,
                )

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_new_connection(request):
    """
    Create a new connection with terms_value for host-to-guest and
    terms_value_reverse for guest-to-host.

    Parameters:
    - Form data: connection_name, connection_type_id, host_locker_name,
                 guest_locker_name, host_user_username, guest_user_username,
                 connection_description (optional)
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    # Extract form data
    connection_type_id = request.POST.get("connection_type_id")
    connection_name = request.POST.get("connection_name")
    connection_description = request.POST.get("connection_description", "")
    host_locker_name = request.POST.get("host_locker_name")
    guest_locker_name = request.POST.get("guest_locker_name")
    host_user_username = request.POST.get("host_user_username")
    guest_user_username = request.POST.get("guest_user_username")

    if not all(
        [
            connection_type_id,
            connection_name,
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
        # Retrieve host and guest user and locker data
        host_user = CustomUser.objects.get(username=host_user_username)
        host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
        guest_user = CustomUser.objects.get(username=guest_user_username)
        guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
        connection_type = ConnectionType.objects.get(
            connection_type_id=connection_type_id,
            owner_locker=host_locker,
            owner_user=host_user,
        )
    except (
        ConnectionType.DoesNotExist,
        Locker.DoesNotExist,
        CustomUser.DoesNotExist,
    ) as e:
        return JsonResponse({"success": False, "error": f"{str(e)}"}, status=404)

    # Separate terms for each direction
    terms_host_to_guest = ConnectionTerms.objects.filter(
        conn_type=connection_type,
        from_Type=ConnectionTerms.TermFromTo.HOST,
        to_Type=ConnectionTerms.TermFromTo.GUEST,
        modality="obligatory",
    )
    terms_guest_to_host = ConnectionTerms.objects.filter(
        conn_type=connection_type,
        from_Type=ConnectionTerms.TermFromTo.GUEST,
        to_Type=ConnectionTerms.TermFromTo.HOST,
        modality="obligatory",
    )

    # Populate terms_value for host-to-guest and terms_value_reverse for guest-to-host
    terms_value = {term.data_element_name: "; F" for term in terms_guest_to_host}
    terms_value_reverse = {
        term.data_element_name: "; F" for term in terms_host_to_guest
    }

    # Populate resource_json for file-sharing terms
    resource_json = {}
    for term in terms_host_to_guest | terms_guest_to_host:  # Include both directions
        if term.data_type == "Upload File":
            resource_json.setdefault(term.sharing_type, [])

    # Debugging output
    print("guest-to-host terms_value:", terms_value)
    print("host-to-guest terms_value_reverse:", terms_value_reverse)
    print("Resource JSON:", resource_json)

    # Save the connection with populated fields
    try:
        connection = Connection(
            connection_name=connection_name,
            connection_type=connection_type,
            host_locker=host_locker,
            guest_locker=guest_locker,
            host_user=host_user,
            guest_user=guest_user,
            connection_description=connection_description,
            requester_consent=False,
            connection_status="established",
            revoke_host=False,
            revoke_guest=False,
            
            terms_value=terms_value,
            terms_value_reverse=terms_value_reverse,
            resources=resource_json,
            validity_time=connection_type.validity_time,
        )
        connection.save()

        notification_message = f"{guest_user.username} has connected to the connection type '{connection_type.connection_type_name}' associated with Locker '{host_locker.name}'."

        # Build rich, serializable extra_data for the notification
        extra_data = {
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_id": connection_type.connection_type_id,
            "connection_type_name": connection_type.connection_type_name,
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
            "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
            "connection_info": ConnectionSerializer(connection).data,
        }
        # Create a notification for the new connection
        Notification.objects.create(
            connection=connection,
            connection_type=connection_type,
            host_user=host_user,
            guest_user=guest_user,
            host_locker=host_locker,
            guest_locker=guest_locker,
            message=notification_message,
            created_at=timezone.now(),
            notification_type="connection_created",
            target_type="connection",
            target_id=str(connection.connection_id),
            extra_data=extra_data,
        )

        return JsonResponse(
            {"success": True, "id": connection.connection_id}, status=201
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == "POST":

        auth = request.META["HTTP_AUTHORIZATION"].split()
        auth_decoded = base64.b64decode(auth[1]).decode("utf-8")
        username, password = auth_decoded.split(":")

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)  # Log the user in
            user_serializer = UserSerializer(user)
            return Response(
                {"success": True, "user": user_serializer.data},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"success": False, "error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_consent(request):
    """
    Close consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - close_host: Boolean indicating if the host user is closing consent.
    - close_guest: Boolean indicating if the guest user is closing consent.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful closing of consent.
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

    # Extract form data
    connection_name = request.POST.get("connection_name")
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    close_guest = request.POST.get("close_host", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]
    close_host = request.POST.get("close_guest", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]

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

        # Update the close connection status based on the provided flags
        if close_host:
            connection.close_host = True

        if close_guest:
            connection.close_guest = True

        # Save the connection
        if connection.close_host and connection.close_guest:
            connection.connection_status = "closed"
        connection.save()

        return JsonResponse(
            {"success": True, "message": "Consent closed successfully"}, status=200
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



# def close_connection_guest(request: HttpRequest) -> JsonResponse:
#     """
#     API to handle guest-initiated closure of a connection.

#     Expected JSON data (form data):
#     {
#         "connection_id": value
#     }
#     """
#     if request.method != "POST":
#         return JsonResponse(
#             {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
#             status=405,
#         )

#     connection_id = request.POST.get("connection_id")
#     print(connection_id)
    
#     if not connection_id:
#         return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

#     connection = Connection.objects.filter(connection_id=connection_id).first()
#     if not connection:
#         return JsonResponse(
#             {"message": f"Connection with ID = {connection_id} does not exist."},
#             status=404,
#         )
#     print(connection)
#     print(connection.connection_status)
#     print(connection.connection_type)
#     if connection.close_guest:
#         return JsonResponse({"message": "Guest has already closed this connection."}, status=200)

#     terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
#     for term in terms:
#         if term.modality.lower() == "forbidden" and not connection.close_host:
#             connection.close_guest = True
#             connection.save()
#             return JsonResponse(
#                 {"message": "Guest has closed. Waiting for host to close."},
#                 status=200,
#             )
#         break
        
#     print("something")
#     connection.close_guest = True
#     connection.close_host = True
#     if connection.close_guest and connection.close_host:
#         connection.connection_status = 'closed'

#     connection.save()
#     return JsonResponse(
#         {"message": f"Connection with ID = {connection_id} has been successfully closed by the guest."},
#         status=200,
#     )

# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def close_connection_host(request: HttpRequest) -> JsonResponse:
#     """
#     API to handle host-initiated closure of a connection.

#     Expected JSON data (form data):
#     {
#         "connection_id": value
#     }
#     """
#     if request.method != "POST":
#         return JsonResponse(
#             {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
#             status=405,
#         )

#     connection_id = request.POST.get("connection_id")
#     if not connection_id:
#         return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

#     connection = Connection.objects.filter(connection_id=connection_id).first()
#     if not connection:
#         return JsonResponse(
#             {"message": f"Connection with ID = {connection_id} does not exist."},
#             status=404,
#         )

#     if connection.close_host:
#         return JsonResponse({"message": "Host has already closed this connection."}, status=200)

#     terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
#     for term in terms:
#         if term.modality.lower() == "forbidden" and not connection.close_guest:
#             connection.close_host = True
#             connection.save()
#             return JsonResponse(
#                 {"message": "Host has closed. Waiting for guest to close."},
#                 status=200,
#             )
#         break
        
#     print("something-host")    
#     connection.close_host = True
#     connection.close_guest = True
#     if  connection.close_guest and connection.close_host:
#         connection.connection_status="closed"

#     connection.save()
#     return JsonResponse(
#         {"message": f"Connection with ID = {connection_id} has been successfully closed by the host."},
#         status=200,
#     )
@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_guest(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
            status=405,
        )

    connection_id = request.POST.get("connection_id")
    if not connection_id:
        return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

    connection = Connection.objects.filter(connection_id=connection_id).first()
    if not connection:
        return JsonResponse({"message": f"Connection with ID = {connection_id} does not exist."}, status=404)

    if connection.close_guest:
        return JsonResponse({"message": "Guest has already closed this connection."}, status=200)

    # Mark guest as closed
    connection.close_guest = True
    connection.save()
    # Check modality
    terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
    forbidden = any(term.modality.lower() == "forbidden" for term in terms)

    if forbidden:
        if connection.close_host==False:
            return  JsonResponse({"message":"Guest has closed. Waiting for Host to close."},status=200)
        # Wait for host if not yet closed
        if connection.close_host==True:
            connection.connection_status = "closed"
            connection.save()
            return JsonResponse({"message": "connection closed successfully (non_unilateral)."}, status=200)
    else:
        # Close from guest side in unilateral case
        connection.close_host = True
        connection.connection_status = "closed"
        connection.save()
        return JsonResponse({"message": "Connection closed successfully (unilateral)."}, status=200)



@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_host(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
            status=405,
        )

    connection_id = request.POST.get("connection_id")
    if not connection_id:
        return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

    connection = Connection.objects.filter(connection_id=connection_id).first()
    if not connection:
        return JsonResponse({"message": f"Connection with ID = {connection_id} does not exist."}, status=404)

    if connection.close_host:
        return JsonResponse({"message": "Host has already closed this connection."}, status=200)

    # Mark host as closed
    connection.close_host = True
    connection.save()

    # Check modality
    terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
    forbidden = any(term.modality.lower() == "forbidden" for term in terms)

    if forbidden:
        if connection.close_guest==False:
            return JsonResponse({"message":"Host has closed. Waiting for Guest to close."},status=200)
        # Wait for guest if not yet closed
        if connection.close_guest==True:
            connection.connection_status = "closed"
            connection.save()
            return JsonResponse({"message": "connection closed successfully (non_unilateral)."}, status=200)
    else:
        # Close from host side in unilateral case
        connection.close_guest = True
        connection.connection_status = "closed"
        connection.save()
        return JsonResponse({"message": "Connection closed successfully (unilateral)."}, status=200)



@csrf_exempt
@api_view(['GET'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])

def get_connections_by_user(request):
    """
    Retrieve connections for a specific user.

    This view handles GET requests to fetch connections for a specific user,
    identified by a 'username' query parameter.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username: The username of the user whose connections are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of connections or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 404: Specified user not found or no connections found.
        - 405: Request method not allowed (if not GET).
        - 400: Bad request (missing parameters or other errors).

    """
    if request.method == 'GET':
        username = request.GET.get('username')
        if not username:
            return JsonResponse({'error': 'Username parameter is required'}, status=400)

        try:
            user = CustomUser.objects.get(username=username)
            connections = Connection.objects.filter(
                host_user=user
            ).distinct()

            if not connections.exists():
                return JsonResponse({'error': 'No connections found for the specified user'}, status=404)

            serializer = ConnectionSerializer(connections, many=True)
            return JsonResponse({'connections': serializer.data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def show_terms(request):
#     """
#     Retrieve terms associated with a specific user.

#     This view handles GET requests to fetch terms for a specific user,
#     identified by a 'username' query parameter, and optionally filtered by 'term_id'.

#     Parameters:
#         - request: HttpRequest object containing metadata about the request.

#     Query Parameters:
#         - username: The username of the user whose terms are to be fetched.
#         - locker_name: The locker name of the user to be fetched
#         - term_id: Optional. The ID of the specific term to be fetched.
#         - connection_name: Name of the active connection for which terms are to be fetched

#     Returns:
#         - JsonResponse: A JSON object containing a list of terms or an error message.

#     Response Codes:
#         - 200: Successful retrieval of terms.
#         - 401: User is not authenticated.
#         - 404: Specified user not found or no terms found.
#         - 405: Request method not allowed (if not GET).
#         - 400: Bad request (missing parameters or other errors).

#     {
#             "connectionName": "Alumni Networks",
#             "connectionDescription": "Connection type that establishes communication between alumni.",
#             "lockerName": "Transcripts",
#             "obligations":
#             [{
#                 "labelName": "Graduation Batch",
#                 "typeOfAction": "Add Value",
#                 "typeOfSharing": "Share",
#                 "labelDescription": "It is obligatory to submit your graduation batch in order to accept the terms of this connection",
#                 "hostPermissions": ["Re-share", "Download"]
#             }],
#             "permissions":
#             {
#                 "canShareMoreData": true,
#                 "canDownloadData": false
#             },
#             "validity": "2024-12-31"
#         }

#     """
#     if request.method == "GET":

#         username = request.GET.get("username")
#         locker_name = request.GET.get("locker_name")
#         connection_name = request.GET.get("connection_name")
#         try:
#             if username:
#                 try:
#                     user = CustomUser.objects.get(username=username)

#                 except CustomUser.DoesNotExist:
#                     return JsonResponse(
#                         {"success": False, "error": "User not found"}, status=404
#                     )
#             else:
#                 if request.user.is_authenticated:
#                     user = request.user
#                 else:
#                     return JsonResponse(
#                         {"success": False, "error": "User not authenticated"},
#                         status=401,
#                     )

#             locker = Locker.objects.filter(name=locker_name, user_id=user.user_id)

#             if locker:
#                 conn = Connection.objects.filter(
#                     connection_name=connection_name
#                 )  # Assuming Unique Connection Name

#             else:
#                 conn = []

#             if conn and locker:
#                 connection_types = ConnectionType.objects.filter(
#                     connection_type_id=conn[0].connection_type_id
#                 )
#             else:
#                 connection_types = []

#             terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)

#             if not terms.exists():
#                 return JsonResponse(
#                     {"success": False, "message": "No terms found for this user"},
#                     status=404,
#                 )

#             serializer = ConnectionTermsSerializer(terms, many=True)

#             filtered_data = {}
#             filtered_data["connectionName"] = conn[0].connection_name
#             filtered_data["connectionDescription"] = conn[0].connection_description
#             filtered_data["lockerName"] = locker_name

#             obligations = []
#             perm = {"canShareMoreData": False, "canDownloadData": False}

#             for term in serializer.data:
#                 if term["modality"] == "obligatory":
#                     d = {}
#                     d["labelName"] = term["data_element_name"]
#                     d["typeOfAction"] = term["data_type"]
#                     d["typeOfSharing"] = term["sharing_type"]
#                     d["purpose"] = term.get("purpose", "")
#                     d["labelDescription"] = term["description"]
#                     d["hostPermissions"] = term["host_permissions"]
#                     obligations.append(d)
#                 else:
#                     if term["description"] == "They can share more data.":
#                         perm["canShareMoreData"] = True
#                     if term["description"] == "They can download data.":
#                         perm["canDownloadData"] = True

#             filtered_data["obligations"] = obligations
#             filtered_data["permissions"] = perm

#             return JsonResponse({"success": True, "terms": filtered_data}, status=200)

#         except CustomUser.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "User not found"}, status=404
#             )
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)}, status=400)


#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def show_terms(request):
    """
    Retrieve terms associated with a specific user.

    This view handles GET requests to fetch terms for a specific user,
    identified by a 'username' query parameter, and optionally filtered by 'term_id'.

    Query Parameters:
        - username: The username of the user whose terms are to be fetched.
        - locker_name: The locker name of the user to be fetched.
        - connection_name: Name of the active connection for which terms are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.
    """
    if request.method == "GET":

        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")

        try:
            # Get the user
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            # Get the locker
            locker = Locker.objects.filter(
                name=locker_name, user_id=user.user_id
            ).first()
            if not locker:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            # Get the connection
            conn = Connection.objects.filter(connection_name=connection_name).first()
            if not conn:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Get the connection type and associated terms
            connection_types = ConnectionType.objects.filter(
                connection_type_id=conn.connection_type_id
            )

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)
            serializer = ConnectionTermsSerializer(terms, many=True)

            # Prepare response data
            filtered_data = {}
            filtered_data["connectionName"] = conn.connection_name
            filtered_data["connectionDescription"] = conn.connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            permissions = {"canShareMoreData": False, "canDownloadData": False}
            forbidden = []

            for term in serializer.data:
                if (term["to_Type"] == "Host" or term["to_Type"] == "HOST") and (
                    term["from_Type"] == "Guest" or term["from_Type"] == "GUEST"
                ):
                    term_data = {
                        "labelName": term["data_element_name"],
                        "typeOfAction": term["data_type"],
                        "typeOfSharing": term["sharing_type"],
                        "purpose": term.get("purpose", ""),
                        "labelDescription": term["description"],
                        "hostPermissions": term["host_permissions"],
                    }

                    if term["modality"] == "obligatory":
                        obligations.append(term_data)
                    elif term["modality"] == "forbidden":
                        forbidden.append(term_data)
                    else:
                        if term["description"] == "They can share more data.":
                            permissions["canShareMoreData"] = True
                        if term["description"] == "They can download data.":
                            permissions["canDownloadData"] = True

            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = permissions
            filtered_data["forbidden"] = forbidden  # Add forbidden terms

            return JsonResponse({"success": True, "terms": filtered_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def show_terms_reverse(request):
#     """
#     Retrieve terms associated with a specific user.

#     This view handles GET requests to fetch terms for a specific user,
#     identified by a 'username' query parameter, and optionally filtered by 'term_id'.

#     Query Parameters:
#         - username: The username of the user whose terms are to be fetched.
#         - locker_name: The locker name of the user to be fetched.
#         - connection_name: Name of the active connection for which terms are to be fetched.

#     Returns:
#         - JsonResponse: A JSON object containing a list of terms or an error message.
#     """
#     if request.method == "GET":

#         username = request.GET.get("username")
#         locker_name = request.GET.get("locker_name")
#         connection_name = request.GET.get("connection_name")

#         try:
#             # Get the user
#             if username:
#                 user = CustomUser.objects.get(username=username)
#             else:
#                 if request.user.is_authenticated:
#                     user = request.user
#                 else:
#                     return JsonResponse(
#                         {"success": False, "error": "User not authenticated"},
#                         status=401,
#                     )

#             # Get the locker
#             locker = Locker.objects.filter(
#                 name=locker_name, user_id=user.user_id
#             ).first()
#             if not locker:
#                 return JsonResponse(
#                     {"success": False, "error": "Locker not found"}, status=404
#                 )

#             # Get the connection
#             conn = Connection.objects.filter(connection_name=connection_name).first()
#             if not conn:
#                 return JsonResponse(
#                     {"success": False, "error": "Connection not found"}, status=404
#                 )

#             # Get the connection type and associated terms
#             connection_types = ConnectionType.objects.filter(
#                 connection_type_id=conn.connection_type_id
#             )

#             if not connection_types.exists():
#                 return JsonResponse(
#                     {"success": False, "message": "No terms found for this user"},
#                     status=404,
#                 )

#             terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)
#             serializer = ConnectionTermsSerializer(terms, many=True)

#             # Prepare response data
#             filtered_data = {}
#             filtered_data["connectionName"] = conn.connection_name
#             filtered_data["connectionDescription"] = conn.connection_description
#             filtered_data["lockerName"] = locker_name

#             obligations = []
#             permissions = {"canShareMoreData": False, "canDownloadData": False}
#             forbidden = []

#             for term in serializer.data:
#                 if (term["from_Type"] == "Host" or term["from_Type"] == "HOST") and (
#                     term["to_Type"] == "Guest" or term["to_Type"] == "GUEST"
#                 ):
#                     term_data = {
#                         "labelName": term["data_element_name"],
#                         "typeOfAction": term["data_type"],
#                         "typeOfSharing": term["sharing_type"],
#                         "purpose": term.get("purpose", ""),
#                         "labelDescription": term["description"],
#                         "hostPermissions": term["host_permissions"],
#                     }

#                     if term["modality"] == "obligatory":
#                         obligations.append(term_data)
#                     elif term["modality"] == "forbidden":
#                         forbidden.append(term_data)
#                     else:
#                         if term["description"] == "They can share more data.":
#                             permissions["canShareMoreData"] = True
#                         if term["description"] == "They can download data.":
#                             permissions["canDownloadData"] = True

#             filtered_data["obligations"] = obligations
#             filtered_data["permissions"] = permissions
#             filtered_data["forbidden"] = forbidden  # Add forbidden terms

#             return JsonResponse({"success": True, "terms": filtered_data}, status=200)

#         except CustomUser.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "User not found"}, status=404
#             )
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)}, status=400)


#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def show_terms_reverse(request):
    """
    Retrieve terms associated with a specific user from the host's perspective.

    This view handles GET requests to fetch terms where the host is sharing data with the guest,
    identified by a 'username' query parameter, and optionally filtered by 'locker_name' and 'connection_name'.

    Query Parameters:
        - username: The username of the user whose terms are to be fetched.
        - locker_name: The locker name of the user to be fetched.
        - connection_name: Name of the active connection for which terms are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.
    """
    if request.method == "GET":

        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")

        try:
            # Get the user
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            # Get the locker
            locker = Locker.objects.filter(
                name=locker_name, user_id=user.user_id
            ).first()
            if not locker:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            # Get the connection
            conn = Connection.objects.filter(connection_name=connection_name).first()
            if not conn:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Get the connection type and associated terms
            connection_types = ConnectionType.objects.filter(
                connection_type_id=conn.connection_type_id
            )

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)
            serializer = ConnectionTermsSerializer(terms, many=True)

            # Prepare response data
            filtered_data = {}
            filtered_data["connectionName"] = conn.connection_name
            filtered_data["connectionDescription"] = conn.connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            permissions = {"canShareMoreData": False, "canDownloadData": False}
            forbidden = []

            # Loop through serialized terms and categorize based on modality
            for term in serializer.data:
                if (term["from_Type"].lower() == "host") and (
                    term["to_Type"].lower() == "guest"
                ):
                    term_data = {
                        "labelName": term["data_element_name"],
                        "typeOfAction": term["data_type"],
                        "typeOfSharing": term["sharing_type"],
                        "purpose": term.get("purpose", ""),
                        "labelDescription": term["description"],
                        "hostPermissions": term["host_permissions"],
                    }

                    # Classify term based on modality
                    if term["modality"].lower() == "obligatory":
                        obligations.append(term_data)
                    elif term["modality"].lower() == "forbidden":
                        forbidden.append(term_data)
                    else:
                        if term["description"] == "They can share more data.":
                            permissions["canShareMoreData"] = True
                        if term["description"] == "They can download data.":
                            permissions["canDownloadData"] = True

            # Add categorized terms to the response
            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = permissions
            filtered_data["forbidden"] = forbidden  # Add forbidden terms

            return JsonResponse({"success": True, "terms": filtered_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def give_consent(request):
    """
    Give consent for a connection and store consent date in the database.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - consent: Boolean indicating the consent status.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful update of the consent status.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: Request User not authenticated.
    - 403: Permission denied.
    - 404: Specified connection or user or locker not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    connection_name = request.POST.get("connection_name")
    connection_type_id = request.POST.get("connection_type_id")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    consent = request.POST.get("consent")

    if None in [
        connection_name,
        connection_type_id,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
        consent,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Fetch the connection type
        try:
            connection_type = ConnectionType.objects.get(
                pk=connection_type_id
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Connection type not found: {connection_type_id}",
                },
                status=404,
            )

        # Fetch the connection using the connection name, connection type, guest user, and host user
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type_id=connection_type,
                guest_user=guest_user,
                host_user=host_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        # Check if the requesting user is the guest user
        if request.user != guest_user:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        # Update the consent status and save consent date
        consent_status = consent.lower() in ["true", "1", "t", "y", "yes"]
        connection.requester_consent = consent_status

        if consent_status:
            # Set the consent given date to now
            connection.consent_given = datetime.now()

            # Use the validity_time already set in the connection model
            validity_date = connection_type.validity_time

        # Save the connection after updating
        connection.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Consent status updated successfully",
                "consent_given_date": connection.consent_given.strftime(
                    "%B %d, %Y, %I:%M %p"
                ),
                "valid_until": validity_date.strftime("%B %d, %Y, %I:%M %p"),
            },
            status=200,
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


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revoke_consent(request):
    """
    Revoke consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - revoke_host: Boolean indicating if the host user is revoking consent.
    - revoke_guest: Boolean indicating if the guest user is revoking consent.

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

    # Extract form data
    connection_name = request.POST.get("connection_name")
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    revoke_host = request.POST.get("revoke_host", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]
    revoke_guest = request.POST.get("revoke_guest", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]

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

        # Set requester_consent to False
        connection.requester_consent = False

        # Update the revocation status based on the provided flags
        if revoke_host:
            connection.revoke_host = True

        if revoke_guest:
            connection.revoke_guest = True

        # Save the connection
        connection.save()

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


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_by_user_by_locker(request):
    """
    Retrieves all the connections of the logged-in user and the associated locker.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - locker_name : The name of the locker of the currently logged-in user whose incoming and
                    outgoing connections have to be fetched / The name of the locker that is owned by some other
                    user that the logged-in user is currently viewing.
        - username : The username of the user whose locker the current logged-in user is currently viewing.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 404: Specified locker not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            locker_name = request.GET.get("locker_name")
            username = request.GET.get("username")

            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            # Determine the user and locker based on whether 'username' is provided
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                user = request.user

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            if not locker:
                return JsonResponse(
                    {"success": False, "message": "No such locker found for this user"},
                    status=404,
                )

            # Fetch incoming connections
            incoming_connections = Connection.objects.filter(
                host_user=user, host_locker=locker
            )
            incoming_serializer = ConnectionSerializer(incoming_connections, many=True)

            # Count the number of unique guest users in incoming connections
            guest_users_count = (
                incoming_connections.values("guest_user").distinct().count()
            )

            # Fetch outgoing connections
            outgoing_connections = Connection.objects.filter(
                guest_user=request.user, guest_locker=locker
            )
            outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

            # Count the number of unique users in each incoming connection type
            connection_type_counts = defaultdict(int)
            for connection in incoming_connections:
                # Ensure the connection_type is converted to a string
                connection_type_str = str(connection.connection_type)
                connection_type_counts[connection_type_str] += 1

            connections = {
                "incoming_connections": incoming_serializer.data,
                "outgoing_connections": outgoing_serializer.data,
                "total_number_of_users_in_incoming_connections": guest_users_count,
                "connection_type_counts": dict(
                    connection_type_counts
                ),  # Add the counts here
            }

            return JsonResponse(
                {
                    "success": True,
                    "connections": connections,
                },
                status=200,
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    else:
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )
    
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_by_user(request):
    """
    Retrieves all outgoing connections of the logged-in user.

    Returns:
        - JsonResponse: A JSON object containing a list of outgoing connections or an error message.
    Response Codes:
        - 200: Success
        - 401: Unauthorized
        - 405: Invalid Method
    """
    if request.method == "GET":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            # Get all connections where the logged-in user is the guest
            outgoing_connections = Connection.objects.filter(guest_user=request.user)
            outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

            return JsonResponse(
                {
                    "success": True,
                    "outgoing_connections": outgoing_serializer.data,
                },
                status=200,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    else:
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_all_connections(request):
    """
    Retrieves all connections, both incoming and outgoing.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Returns:
        - JsonResponse: A JSON object containing a list of all connections or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            # Fetch all connections
            all_connections = Connection.objects.all()

            connections = [
                {
                    "connection_name": conn.connection_name,
                    "host_user_locker": conn.host_locker.name,
                    "guest_user_locker": conn.guest_locker.name,
                    "is_frozen": conn.is_frozen,
                    "connection_id": conn.connection_id,
                }
                for conn in all_connections
            ]

            return JsonResponse(
                {"success": True, "connections": connections}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_resource_by_user_by_locker(request):
    """
    Retrieves all the resources of a particular locker of the logged-in user.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - locker_name : The name of the locker whose resources have to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of resources.
        - 401: User is not authenticated.
        - 404: Specified user not found, Specified locker not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            locker_name = request.GET.get("locker_name")
            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            # If the current user does not have the given locker with "locker_name"
            if not locker:
                return JsonResponse(
                    {"success": False, "message": "No such locker found for this user"},
                    status=404,
                )

            resources = Resource.objects.filter(locker=locker)
            serializer = ResourceSerializer(resources, many=True)

            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST", "PUT"])
@permission_classes([AllowAny])
def signup_user(request):
    if request.method == "POST":
        try:
            username = request.POST.get("username")
            description = request.POST.get("description")
            password = request.POST.get("password")
            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )
            if not description:
                return JsonResponse(
                    {"success": False, "error": "Description is required"}, status=400
                )
            if not password:
                return JsonResponse(
                    {"success": False, "error": "Password is required"}, status=400
                )

            # Check if username already exists
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse(
                    {"success": False, "error": "Username already taken"}, status=400
                )

            new_user = CustomUser(description=description, username=username)
            new_user.set_password(password)
            new_user.save()

            return JsonResponse(
                {
                    "success": True,
                    "id": new_user.user_id,
                    "username": new_user.username,
                    "description": new_user.description,
                },
                status=201,
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    if request.method == "PUT":
        """
        Expected JSON data:
        {
            "username": value,
            "new_name": value,
            "new_description": value,
            "new_password": value
        }
        """
        data = request.data
        username = data.get("username")
        new_name = data.get("new_name")
        new_description = data.get("new_description")
        new_password = data.get("new_password")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username must be provided."}, status=400
            )

        user = CustomUser.objects.filter(username=username).first()
        if user:
            if new_name:
                user.username = new_name
            if new_description:
                user.description = new_description
            if new_password:
                user.set_password(new_password)
            user.save()
            return JsonResponse(
                {"success": True, "message": "User updated successfully."}
            )

        return JsonResponse(
            {"success": False, "error": "User does not exist."}, status=404
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_locker(request):
    """
    Freeze or unfreeze a locker based on its current status.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Form Parameters:
        - username: The username of the user whose locker is to be frozen or unfrozen.
        - locker_name: Name of the locker to be frozen or unfrozen.
        - action: Specifies whether to "freeze" or "unfreeze" the locker.

    Returns:
        - JsonResponse: A JSON object indicating success or an error message.

    Response Codes:
        - 200: Successful freezing or unfreezing of the locker.
        - 400: Bad request (if data is invalid).
        - 401: User not authenticated.
        - 403: Forbidden (if the requesting user does not have permission).
        - 404: Locker not found.
        - 405: Request method not allowed (if not PUT).
    """
    if request.method == "PUT":
        if not request.user.is_authenticated:
            return JsonResponse(
                {"success": False, "error": "User not authenticated"}, status=401
            )

        # Check if the requesting user is a sys_admin or moderator
        requesting_user = request.user
        if requesting_user.user_type not in [
            "sys_admin",
            CustomUser.SYS_ADMIN,
            CustomUser.MODERATOR,
        ]:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        username = request.data.get("username")
        locker_name = request.data.get("locker_name")
        action = request.data.get("action")

        if not username or not locker_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username, locker name, and action are required",
                },
                status=400,
            )

        try:
            user = CustomUser.objects.get(username=username)
            locker = Locker.objects.get(name=locker_name, user=user)
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=404
            )

        if action == "freeze":
            if locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is already frozen"}, status=400
                )
            locker.is_frozen = True
            locker.save()
            return JsonResponse(
                {"success": True, "message": f'Locker "{locker_name}" has been frozen'},
                status=200,
            )

        elif action == "unfreeze":
            if not locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is not frozen"}, status=400
                )
            locker.is_frozen = False
            locker.save()
            return JsonResponse(
                {
                    "success": True,
                    "message": f'Locker "{locker_name}" has been unfrozen',
                },
                status=200,
            )

        else:
            return JsonResponse(
                {"success": False, "error": "Invalid action specified"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_connection(request):
    """
    Freeze or unfreeze a connection based on the specified action.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - connection_name: The name of the connection to freeze or unfreeze.
    - connection_id: The ID of the connection to freeze or unfreeze (optional).
    - action: Specifies whether to "freeze" or "unfreeze" the connection.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing or unfreezing of the connection.
    - 404: Specified user or connection not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        connection_name = request.data.get("connection_name")
        connection_id = request.data.get("connection_id")
        action = request.data.get("action")

        if not connection_id or not connection_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "connection_id, Connection Name, and Action are required",
                },
                status=400,
            )

        try:
            # Check if the requesting user is a sys_admin or moderator
            requesting_user = request.user
            if requesting_user.user_type not in [
                "sys_admin",
                CustomUser.SYS_ADMIN,
                CustomUser.MODERATOR,
            ]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )


            if connection_id:
                # Fetch connection by connection_id
                connection = Connection.objects.get(connection_id=connection_id)
            else:
                # Fetch connection by  connection_name
                connection = Connection.objects.get(
                    connection_name=connection_name, connection_id=connection_id
                )

            if action == "freeze":
                if connection.is_frozen:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "This connection is already frozen",
                        },
                        status=200,
                    )
                else:
                    connection.is_frozen = True
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been frozen successfully",
                        },
                        status=200,
                    )

            elif action == "unfreeze":
                if not connection.is_frozen:
                    return JsonResponse(
                        {"success": False, "message": "This connection is not frozen"},
                        status=200,
                    )
                else:
                    connection.is_frozen = False
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been unfrozen successfully",
                        },
                        status=200,
                    )

            else:
                return JsonResponse(
                    {"success": False, "error": "Invalid action specified"}, status=400
                )

        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



#this is old code
# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def create_connection_type_and_connection_terms(request):
#     if request.method != "POST":
#         return JsonResponse(
#             {"success": False, "error": "Invalid request method"}, status=405
#         )

#     if not request.user.is_authenticated:
#         return JsonResponse({"error": "User not authenticated"}, status=401)

#     try:
#         data = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"error": "Invalid JSON"}, status=400)

#     # Extract data from request
#     connection_type_name = data.get("connectionName")
#     connection_description = data.get("connectionDescription")
#     owner_locker_name = data.get("lockerName")
#     validity_time_str = data.get("validity")
#     post_conditions = data.get("postConditions", {})
#     connection_terms_obligations = data.get("obligations", [])
#     connection_terms_permissions = data.get("permissions", {})
#     forbidden_checkbox = data.get("forbidden", [])
#     from_Type = data.get("from")
#     to_Type = data.get("to")

#     if not all(
#         [
#             connection_type_name,
#             owner_locker_name,
#             validity_time_str,
#             post_conditions,
#             connection_description,
#             from_Type,
#             to_Type,
#         ]
#     ):
#         return JsonResponse(
#             {"success": False, "error": "All fields are required"}, status=400
#         )

#     try:
#         owner_user = CustomUser.objects.get(username=request.user)
#         owner_locker = Locker.objects.filter(
#             name=owner_locker_name, user=owner_user
#         ).first()

#         if not owner_locker:
#             return JsonResponse(
#                 {"success": False, "error": "Owner locker not found"}, status=404
#             )

#         # Check if connection type with the same direction already exists
#         if ConnectionType.objects.filter(
#             connection_type_name=connection_type_name,
#             owner_user=owner_user,
#             owner_locker=owner_locker,
#             connectionterms__from_Type=from_Type,
#             connectionterms__to_Type=to_Type,
#         ).exists():
#             return JsonResponse(
#                 {
#                     "success": False,
#                     "error": f"Connection type '{connection_type_name}' with the same direction already exists in '{owner_locker_name}'.",
#                 },
#                 status=400,
#             )

#         # Parse the validity time
#         validity_time = parse_datetime(validity_time_str)
#         if validity_time is None:
#             raise ValueError("Invalid date format")

#         # Create or retrieve the connection type
#         new_connection_type, created = ConnectionType.objects.get_or_create(
#             connection_type_name=connection_type_name,
#             owner_user=owner_user,
#             owner_locker=owner_locker,
#             post_conditions=post_conditions,
#             defaults={
#                 "connection_description": connection_description,
#                 "validity_time": validity_time,
#             },
#         )

#         # Helper function to create terms for the specified direction
#         def create_terms_for_direction(
#             obligations, permissions, forbidden, direction_from, direction_to
#         ):
#             for obligation in obligations:
#                 global_conn_type_id = obligation.get("global_conn_type_id")
#                 ConnectionTerms.objects.create(
#                     conn_type=new_connection_type,
#                     modality="obligatory",
#                     data_element_name=obligation["labelName"],
#                     data_type=obligation["typeOfAction"],
#                     sharing_type=obligation["typeOfSharing"],
#                     purpose=obligation.get("purpose", ""),
#                     description=obligation["labelDescription"],
#                     host_permissions=obligation.get("hostPermissions", []),
#                     global_conn_type_id=global_conn_type_id,  # Ensure this is correctly assigned
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             # Permissive terms
#             if permissions.get("canShareMoreData", False):
#                 ConnectionTerms.objects.create(
#                     conn_type=new_connection_type,
#                     modality="permissive",
#                     description="They can share more data.",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             if permissions.get("canDownloadData", False):
#                 ConnectionTerms.objects.create(
#                     conn_type=new_connection_type,
#                     modality="permissive",
#                     description="They can download data.",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             # Forbidden terms
#             if forbidden and "Cannot close unilaterally" in forbidden:
#                 ConnectionTerms.objects.create(
#                     conn_type=new_connection_type,
#                     modality="forbidden",
#                     description="You cannot unilaterally close the connection",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#         # Create terms only in the specified direction (from_Type to to_Type)
#         create_terms_for_direction(
#             connection_terms_obligations,
#             connection_terms_permissions,
#             forbidden_checkbox,
#             from_Type,
#             to_Type,
#         )

#         return JsonResponse(
#             {
#                 "success": True,
#                 "connection_type_message": "Connection Type successfully created",
#                 "connection_terms_message": "Connection Terms successfully created from HOST to GUEST",
#             },
#             status=201,
#         )

#     except CustomUser.DoesNotExist:
#         return JsonResponse(
#             {"success": False, "error": "Owner user not found"}, status=404
#         )
#     except ValueError as e:
#         return JsonResponse({"success": False, "error": str(e)}, status=400)
#     except Exception as e:
#         return JsonResponse({"success": False, "error": str(e)}, status=400)

#modified code for both host and guest obligation set on one submit
@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_connection_type_and_connection_terms(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Extract basic info
    connection_type_name = data.get("connectionName")
    connection_description = data.get("connectionDescription")
    owner_locker_name = data.get("lockerName")
    validity_time_str = data.get("validity")
    post_conditions = data.get("postConditions", {})
    directions = data.get("directions", [])

    if not all([connection_type_name, connection_description, owner_locker_name, validity_time_str, directions]):
        return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

    try:
        owner_user = CustomUser.objects.get(username=request.user)
        owner_locker = Locker.objects.filter(name=owner_locker_name, user=owner_user).first()

        if not owner_locker:
            return JsonResponse({"success": False, "error": "Owner locker not found"}, status=404)

        # Parse validity
        validity_time = parse_datetime(validity_time_str)
        if validity_time is None:
            raise ValueError("Invalid date format")

        # Create or get connection type
        new_connection_type, created = ConnectionType.objects.get_or_create(
            connection_type_name=connection_type_name,
            owner_user=owner_user,
            owner_locker=owner_locker,
            post_conditions=post_conditions,
            defaults={
                "connection_description": connection_description,
                "validity_time": validity_time,
            },
        )

        # Helper function to create terms
        def create_terms_for_direction(obligations, permissions, forbidden, direction_from, direction_to):
            for obligation in obligations:
                global_conn_type_id = obligation.get("global_conn_type_id")
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="obligatory",
                    data_element_name=obligation["labelName"],
                    data_type=obligation["typeOfAction"],
                    sharing_type=obligation["typeOfSharing"],
                    purpose=obligation.get("purpose", ""),
                    description=obligation["labelDescription"],
                    host_permissions=obligation.get("hostPermissions", []),
                    global_conn_type_id=global_conn_type_id,
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canShareMoreData"):
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="permissive",
                    description="They can share more data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canDownloadData"):
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="permissive",
                    description="They can download data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if forbidden and "Cannot close unilaterally" in forbidden:
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="forbidden",
                    description="You cannot unilaterally close the connection",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

        # Loop through both directions
        for direction in directions:
            from_Type = direction.get("from")
            to_Type = direction.get("to")
            obligations = direction.get("obligations", [])
            permissions = direction.get("permissions", {})
            forbidden = direction.get("forbidden", [])

            if not (from_Type and to_Type):
                return JsonResponse({"success": False, "error": "Direction must include both 'from' and 'to'"}, status=400)
            
                        
            # Check if connection type with the same direction already exists
            if ConnectionType.objects.filter(
                connection_type_name=connection_type_name,
                owner_user=owner_user,
                owner_locker=owner_locker,
                connectionterms__from_Type=from_Type,
                connectionterms__to_Type=to_Type,
            ).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": f"Connection type '{connection_type_name}' with the same direction already exists in '{owner_locker_name}'.",
                    },
                    status=400,
                )


            if ConnectionTerms.objects.filter(conn_type=new_connection_type, from_Type=from_Type, to_Type=to_Type).exists():
                continue  # skip or handle update logic

            create_terms_for_direction(obligations, permissions, forbidden, from_Type, to_Type)

        return JsonResponse(
            {
                "success": True,
                "connection_type_message": "Connection Type successfully created",
                "connection_terms_message": "Connection Terms created for all provided directions"
            },
            status=201,
        )

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "Owner user not found"}, status=404)
    except ValueError as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_guest_user_connection(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_locker_name = request.GET.get("host_locker_name")
        host_user_username = request.GET.get("host_user_username")

        if not all([connection_type_name, host_locker_name, host_user_username]):
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_locker=host_locker,
                owner_user=host_user,
            )
            print("==========================================", host_user.user_id)
            print("==========================================", host_locker.locker_id)
           
            connection = Connection.objects.filter(connection_type=connection_type)
            print("==========================================ddd", connection_type.connection_type_id)
            if not connection:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "No Connections found for this Connection Type",
                    },
                    status=404,
                )

            serializer = ConnectionFilterSerializer(connection, many=True)
            return JsonResponse({"connections": serializer.data}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "No such Connection Type found"}, status=404
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
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_guest_user_connection_id(request):
    if request.method == "GET":
        connection_type_id = request.GET.get("connection_type_id")
        locker_id = request.GET.get("locker_id")
        user_id = request.GET.get("user_id")

        if not all([connection_type_id, locker_id, user_id]):
            return JsonResponse(
                {"success": False, "error": "All fields (IDs) are required"}, status=400
            )

        try:
            host_user = CustomUser.objects.get(pk=user_id)
            host_locker = Locker.objects.get(pk=locker_id, user=host_user)
            connection_type = ConnectionType.objects.get(
                pk=connection_type_id,
                owner_locker=host_locker,
                owner_user=host_user,
            )

            print("=========== user_id:", host_user.pk)
            print("=========== locker_id:", host_locker.pk)
            print("=========== connection_type_id:", connection_type.pk)

            connection = Connection.objects.filter(connection_type=connection_type)

            if not connection.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": "No Connections found for this Connection Type",
                    },
                    status=404,
                )

            serializer = ConnectionFilterSerializer(connection, many=True)
            return JsonResponse({"connections": serializer.data}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "No such Connection Type found"}, status=404
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
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_status(request):
    """
    Request Parameters:
    - connection_name
    - host_locker_name
    - guest_locker_name
    - host_user_username
    - guest_user_username
    """
    if request.method == "GET":
        connection_name = request.GET.get("connection_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_name,
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
        except Connection.DoesNotExist:
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

        count_T = 0
        count_F = 0
        count_R = 0
        filled = 0
        empty = 0

        terms_value = connection.terms_value

        # Handle case when terms_value is empty
        if terms_value:
            # Exclude 'canShareMoreData' from terms_value
            filtered_terms = {
                key: value
                for key, value in terms_value.items()
                if key != "canShareMoreData"
            }

            for key, value in filtered_terms.items():
                value = value.strip()
                if value.endswith("; T") or value.endswith(";T"):
                    count_T += 1
                elif value.endswith("; F") or value.endswith(";F"):
                    count_F += 1
                elif value.endswith("; R") or value.endswith(";R"):
                    count_R += 1

                stripped_value = (
                    value.rstrip("; T")
                    .rstrip(";T")
                    .rstrip("; F")
                    .rstrip(";F")
                    .rstrip("; R")
                    .rstrip(";R")
                    .strip()
                )
                if stripped_value:
                    filled += 1
                else:
                    empty += 1

            # Calculate the number of empty terms based on the total count
            total_terms = count_T + count_F + count_R
            if total_terms > 0:
                empty = total_terms - filled
        else:
            # If terms_value is empty, assume all expected terms are empty
            total_terms = count_T + count_F + count_R
            empty = total_terms
            filled = 0

        return JsonResponse(
            {
                "success": True,
                "count_T": count_T,
                "count_F": count_F,
                "count_R": count_R,
                "empty": empty,
                "filled": filled,
            },
            status=200,
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_status_reverse(request):
    """
    Request Parameters:
    - connection_name
    - host_locker_name
    - guest_locker_name
    - host_user_username
    - guest_user_username
    """
    if request.method == "GET":
        connection_name = request.GET.get("connection_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_name,
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
        except Connection.DoesNotExist:
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

        count_T = 0
        count_F = 0
        count_R = 0
        filled = 0
        empty = 0

        terms_value = connection.terms_value_reverse

        # Handle case when terms_value is empty
        if terms_value:
            # Exclude 'canShareMoreData' from terms_value
            filtered_terms = {
                key: value
                for key, value in terms_value.items()
                if key != "canShareMoreData"
            }

            for key, value in filtered_terms.items():
                value = value.strip()
                if value.endswith("; T") or value.endswith(";T"):
                    count_T += 1
                elif value.endswith("; F") or value.endswith(";F"):
                    count_F += 1
                elif value.endswith("; R") or value.endswith(";R"):
                    count_R += 1

                stripped_value = (
                    value.rstrip("; T")
                    .rstrip(";T")
                    .rstrip("; F")
                    .rstrip(";F")
                    .rstrip("; R")
                    .rstrip(";R")
                    .strip()
                )
                if stripped_value:
                    filled += 1
                else:
                    empty += 1

            # Calculate the number of empty terms based on the total count
            total_terms = count_T + count_F + count_R
            if total_terms > 0:
                empty = total_terms - filled
        else:
            # If terms_value is empty, assume all expected terms are empty
            total_terms = count_T + count_F + count_R
            empty = total_terms
            filled = 0

        return JsonResponse(
            {
                "success": True,
                "count_T": count_T,
                "count_F": count_F,
                "count_R": count_R,
                "empty": empty,
                "filled": filled,
            },
            status=200,
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def get_notifications(request):
#     """
#     Get all notifications for the authenticated user.
#     """
#     try:
#         curr_user = request.user
#         notifications = Notification.objects.filter(host_user=curr_user).order_by(
#             "-created_at"
#         )
#         connection = Connection.objects.get(connection_id=extra_data["connection_id"])
#         connection_data = ConnectionSerializer(connection).data

#         notifications_data = []
#         for notification in notifications:
#             notifications_data.append(
#                 {
#                     "id": notification.id,
#                     "is_read": notification.is_read,
#                     "message": notification.message,
#                     "created_at": notification.created_at,
#                     "notification_type": notification.notification_type,
#                     "target_type": notification.target_type,
#                     "target_id": notification.target_id,
#                     "extra_data": notification.extra_data,
#                 }
#             )

#         return JsonResponse(
#             {"success": True, "notifications": notifications_data}, status=200
#         )

#     except Exception as e:
#         return JsonResponse({"success": False, "error": str(e)}, status=400)

@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    Get all notifications for the authenticated user, with latest connection data.
    """
    try:
        curr_user = request.user
        notifications = Notification.objects.filter(host_user=curr_user).order_by(
            "-created_at"
        )

        notifications_data = []

        for notification in notifications:
            connection_data = None
            connection_type_data = None

            # Safely get the connection info from extra_data
            extra_data = notification.extra_data or {}

            connection_id = extra_data.get("connection_id")
            connection_type_id = extra_data.get("connection_type_id")

            # Fetch current connection and connection type info
            if connection_id:
                try:
                    connection = Connection.objects.get(connection_id=connection_id)
                    connection_data = ConnectionSerializer(connection).data
                except Connection.DoesNotExist:
                    connection_data = None

            if connection_type_id:
                try:
                    connection_type = ConnectionType.objects.get(connection_type_id=connection_type_id)
                    connection_type_data = ConnectionTypeSerializer(connection_type).data
                except ConnectionType.DoesNotExist:
                    connection_type_data = None

            extra_data_info = {
                **extra_data,
                "connection_info": connection_data,
                "connection_type_info": connection_type_data,
            }

            notifications_data.append(
                {
                    "id": notification.id,
                    "is_read": notification.is_read,
                    "message": notification.message,
                    "created_at": notification.created_at,
                    "notification_type": notification.notification_type,
                    "target_type": notification.target_type,
                    "target_id": notification.target_id,
                    "extra_data": extra_data_info,
                    "connection_info": connection_data,  
                    "connection_type_info": connection_type_data,
                }
            )

        return JsonResponse(
            {"success": True, "notifications": notifications_data}, status=200
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """
    Mark specific notifications as read for the authenticated user.
    {
    "notification_id": = id
    }
    """
    
    try:
        curr_user = request.user
        notification_id = request.data.get("notification_id")  

        if not notification_id:
            return JsonResponse({"success": False, "error": "Notification ID is required."}, status=400)

        notification = Notification.objects.get(
            Q(id=notification_id) & Q(host_user=curr_user)
        )

        print("notification",notification)
 
        # notification = Notification.objects.get(
        #     Q(id=notification_id) & (Q(host_user=curr_user) | Q(guest_user=curr_user))
        # )

        if not notification.is_read:
            notification.is_read = True
            notification.save()

        return JsonResponse({"success": True}, status=200)

    except Notification.DoesNotExist:
        return JsonResponse({"success": False, "error": "Notification not found."}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


# @csrf_exempt
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

            return JsonResponse({"connections": connection_data}, status=200)

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
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def create_admin(request):
    """
    Promote a user to sys_admin.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to sys_admin.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to sys_admin.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to sys_admin
            user_to_promote.user_type = CustomUser.SYS_ADMIN
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to sys_admin successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def create_moderator(request):
    """
    Promote a user to moderator.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to moderator.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to moderator.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to moderator
            user_to_promote.user_type = CustomUser.MODERATOR
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to moderator successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def remove_admin(request):
    """
    Remove admin privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the admin to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of admin privileges.
    - 400: Bad request (if data is invalid or user is not an admin).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type not in ["system_admin", "sys_admin"]:
                    return JsonResponse(
                        {"success": False, "error": "User is not an admin"}, status=400
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Admin privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def remove_moderator(request):
    """
    Remove moderator privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the moderator to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of moderator privileges.
    - 400: Bad request (if data is invalid or user is not a moderator).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type != "moderator":
                    return JsonResponse(
                        {"success": False, "error": "User is not a moderator"},
                        status=400,
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Moderator privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
# @role_required(CustomUser.SYS_ADMIN)
def create_Global_Connection_Type_Template(request):
    """
    This API is used to create a new global connection type. This API is allowed only for system admins.
    Response Codes:
        - 201: Successfully created a global connection type.
        - 400: The data sent in the request is invalid, missing or malformed.
    Expected JSON (raw JSON data/form data):
    {
        "global_connection_type_name": value,
        "global_connection_type_description": value,
        "global_terms_IDs": list of global connection terms IDs,
        "globaltype": "template" or "policy",
        "domain": "health", "education", "finance", or "personal data"
    }
    """
    data = request.data  # RAW JSON DATA/FORM DATA
    requesting_user: CustomUser = request.user
    if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
        return JsonResponse(
            {
                "message": f"User must be a system admin to access this API endpoint. Current user has {requesting_user.user_type} type."
            }
        )

    # Validate 'global_terms_IDs'
    ids: list = data.get("global_terms_IDs")
    if ids is None or len(ids) == 0:
        return JsonResponse({"message": "List of IDs of terms must not be empty."})

    # Validate 'globaltype'
    globaltype = data.get("globaltype")
    if globaltype not in ["template", "policy"]:
        return JsonResponse(
            {
                "message": "Invalid value for 'globaltype'. Must be either 'template' or 'policy'."
            },
            status=400,
        )

    # Validate 'domain'
    domain = data.get("domain")
    if domain not in ["health", "education", "finance", "personal data"]:
        return JsonResponse(
            {
                "message": "Invalid value for 'domain'. Must be one of 'health', 'education', 'finance', or 'personal data'."
            },
            status=400,
        )

    try:
        template_Data = {
            "global_connection_type_name": data.get("global_connection_type_name"),
            "global_connection_type_description": data.get(
                "global_connection_type_description"
            ),
            "globaltype": globaltype,  # New field added to the template data
            "domain": domain,  # New field added to the template data
        }

        # Create the GlobalConnectionTypeTemplate object
        global_Template: GlobalConnectionTypeTemplate = (
            GlobalConnectionTypeTemplate.objects.create(
                global_connection_type_name=template_Data[
                    "global_connection_type_name"
                ],
                global_connection_type_description=template_Data[
                    "global_connection_type_description"
                ],
                globaltype=template_Data["globaltype"],
                domain=template_Data[
                    "domain"
                ],  # Add the domain field when creating the object
            )
        )
        global_Template.save()

        # Link the created global connection type template to the provided global terms IDs
        for id in data.get("global_terms_IDs"):
            global_Term = ConnectionTerms.objects.filter(terms_id=id).first()
            if global_Term:
                global_Term.global_conn_type = global_Template
                global_Term.save()
            else:
                return JsonResponse(
                    {
                        "message": f"Global connection term with ID = {id} does not exist."
                    }
                )

        return JsonResponse(
            {
                "status": 201,
                "message": f"Global connection type created successfully and linked to the global terms IDs = {data.get('global_terms_IDs')} successfully.",
            }
        )
    except Exception as e:
        print(e)
        return JsonResponse({"message": "Something went wrong.", "error": f"{e}"})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Global_Connection_Type(request):
    """
    This API is used to get all global connection type templates or a particular one if the name is mentioned in the request.
    Expected JSON to get a particular global connection type (raw JSON data/form data):
    {
        "global_connection_type_template_name": value
    }
    To get all conection types, no need to send any JSON.
    """
    if request.method == "GET":
        name = request.data.get(
            "global_connection_type_template_name"
        )  # RAW JSON DATA/FORM DATA
        print(name)
        if name:
            global_Connection_Type = GlobalConnectionTypeTemplate.objects.filter(
                global_connection_type_name=name
            )
            print(global_Connection_Type.first())
            if global_Connection_Type.exists():
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_Connection_Type.first()
                )
                terms = ConnectionTerms.objects.filter(
                    global_conn_type=global_Connection_Type.first()
                )
                terms_Serializer = ConnectionTermsSerializer(terms, many=True)
                return JsonResponse(
                    {
                        "global_connection": serializer.data,
                        "terms_attached_to_global_template": terms_Serializer.data,
                    }
                )
            else:
                return JsonResponse(
                    {
                        "message": f"global connection type template with name = {name} does not exist."
                    }
                )
        else:
            global_Connection_Types = GlobalConnectionTypeTemplate.objects.all()
            serializer = GlobalConnectionTypeTemplateGetSerializer(
                global_Connection_Types, many=True
            )
            return JsonResponse({"data": serializer.data})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def connect_Global_Connection_Type_Template_And_Connection_Type(request):
    """
    Expected JSON (form data):
    {
        "template_Id": value,
        "type_Id": value
    }
    """
    template_Id = request.POST.get("template_Id")  # FORM DATA
    type_Id = request.POST.get("type_Id")  # FORM DATA
    # data = {"connection_type_id": "", "global_connection_template_id": ""}
    if template_Id is not None and type_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"Global connection type template with ID = {template_Id} does not exist."
                }
            )
        else:
            connection_Type = ConnectionType.objects.filter(connection_type_id=type_Id)
            if not connection_Type.exists():
                return JsonResponse(
                    {"message": f"Connection type with ID = {type_Id} does not exist."}
                )
            else:
                link = ConnectionTypeRegulationLinkTable.objects.filter(
                    connection_type_id=connection_Type.first(),
                    global_connection_template_id=template.first(),
                )
                if link.exists():
                    template_Serializer = GlobalConnectionTypeTemplateGetSerializer(
                        template.first()
                    )
                    type_Serializer = ConnectionTypeSerializer(connection_Type.first())
                    return JsonResponse(
                        {
                            "message": "This link already exists.",
                            "existing ID of link in DB": link.first().link_id,
                            "global template": template_Serializer.data,
                            "connection type": type_Serializer.data,
                        }
                    )
                # data["global_connection_template_id"] = template.first()
                # data["connection_type_id"] = connection_Type.first()
                # link = ConnectionTypeRegulationLinkTable(
                #     connection_Type_Id=connection_Type.first(),
                #     conection_Template_Id=template.first(),
                # )

                try:
                    link = ConnectionTypeRegulationLinkTable.objects.create(
                        connection_type_id=connection_Type.first(),
                        global_connection_template_id=template.first(),
                    )
                    # serializer = ConnectionTypeRegulationLinkTablePostSerializer(
                    #     data=link
                    # )
                    # if not serializer.is_valid():
                    #     return JsonResponse(
                    #         {"status": 400, "errors": serializer.errors}
                    #     )
                    # serializer.save()
                    return JsonResponse(
                        {
                            "status": 201,
                            "message": f"Connection type with ID = {type_Id} linked successfully to global connection type template with ID = {template_Id}",
                        }
                    )
                except Exception as e:
                    print(e)
                    return JsonResponse(
                        {"message": "Something went wrong.", "error": f"{e}"}
                    )
    return JsonResponse(
        {"message": f"Template ID = {template_Id} and type ID = {type_Id}"}
    )


# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
#     """
#     Expected JSON (raw JSON data/form data):
#     {
#         "template_Id": value
#     }
#     """
#     template_Id = request.GET.get("template_Id", None)  # RAW JSON DATA/FORM DATA
#     if template_Id is not None:
#         template = GlobalConnectionTypeTemplate.objects.filter(
#             global_connection_type_template_id=template_Id
#         )
#         if not template.exists():
#             return JsonResponse(
#                 {
#                     "message": f"global conection type template with ID = {template_Id} does not exist."
#                 }
#             )
#         else:
#             terms = ConnectionTerms.objects.filter(global_conn_type=template.first())
#             serializer = ConnectionTermsSerializer(terms, many=True)
#             return JsonResponse({"data": serializer.data})

# #old one
# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
#     """
#     Retrieve all terms for a given global connection type template.

#     Query Parameters:
#     - template_Id: The ID of the global connection type template.

#     Returns:
#     - JsonResponse: A JSON object containing the terms and associated details.
#     """
#     template_Id = request.GET.get("template_Id", None)  # RAW JSON DATA/FORM DATA

#     if template_Id is None:
#         return JsonResponse(
#             {"success": False, "error": "Template ID is required"}, status=400
#         )

#     try:
#         # Fetch the template using the provided template_Id
#         template = GlobalConnectionTypeTemplate.objects.filter(
#             global_connection_type_template_id=template_Id
#         )

#         if not template.exists():
#             return JsonResponse(
#                 {
#                     "success": False,
#                     "message": f"Global connection type template with ID = {template_Id} does not exist.",
#                 },
#                 status=404,
#             )

#         template = template.first()

#         # Fetch all connection terms related to the global connection type template
#         terms = ConnectionTerms.objects.filter(global_conn_type=template)

#         if not terms.exists():
#             return JsonResponse(
#                 {
#                     "success": False,
#                     "message": "No terms found for the given global connection type template.",
#                 },
#                 status=404,
#             )

#         obligations = []
#         permissions = {"canShareMoreData": False, "canDownloadData": False}
#         forbidden_terms = []

#         for term in terms:
#             term_data = {
#                 "terms_id": term.terms_id,
#                 "global_conn_type_id": term.global_conn_type_id,
#                 "labelName": term.data_element_name,
#                 "typeOfAction": term.data_type,
#                 "typeOfSharing": term.sharing_type,
#                 "purpose": term.purpose,
#                 "labelDescription": term.description,
#                 "hostPermissions": term.host_permissions,
#             }

#             # Add to obligations, permissions, or forbidden based on modality and description
#             if term.modality == "obligatory":
#                 obligations.append(term_data)
#             elif term.description == "They can share more data.":
#                 permissions["canShareMoreData"] = True
#             elif term.description == "They can download data.":
#                 permissions["canDownloadData"] = True
#             elif term.modality == "forbidden":
#                 forbidden_terms.append(term_data)

#         response_data = {
#             "template_id": template.global_connection_type_template_id,
#             "template_name": template.global_connection_type_name,
#             "template_description": template.global_connection_type_description,
#             "obligations": obligations,
#             "permissions": permissions,
#             "forbidden": forbidden_terms,
#         }

#         return JsonResponse({"success": True, "data": response_data}, status=200)

#     except Exception as e:
#         return JsonResponse({"success": False, "error": str(e)}, status=400)
    
#new one
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
    """
    Retrieve all terms for a given global connection type template.

    Query Parameters:
    - template_Id: The ID of the global connection type template.

    Returns:
    - JsonResponse: A JSON object containing the terms and associated details.
    """
    template_Id = request.GET.get("template_Id", None)

    if template_Id is None:
        return JsonResponse(
            {"success": False, "error": "Template ID is required"}, status=400
        )

    try:
        # Fetch the template using the provided template_Id
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )

        if not template.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": f"Global connection type template with ID = {template_Id} does not exist.",
                },
                status=404,
            )

        template = template.first()

        # Fetch all connection terms related to the global connection type template
        terms = ConnectionTerms.objects.filter(global_conn_type=template,conn_type_id__isnull=True)
        print("connection terms", terms)

        if not terms.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": "No terms found for the given global connection type template.",
                },
                status=404,
            )

        # Initialize separate categories for guest_host and host_guest
        obligations = {"guest_host": [], "host_guest": []}
        forbidden_terms = {"guest_host": [], "host_guest": []}
        permissions = {
            "guest_host": {"canShareMoreData": False, "canDownloadData": False},
            "host_guest": {"canShareMoreData": False, "canDownloadData": False},
        }

        for term in terms:
            term_data = {
                "terms_id": term.terms_id,
                "global_conn_type_id": term.global_conn_type_id,
                "labelName": term.data_element_name,
                "typeOfAction": term.data_type,
                "typeOfSharing": term.sharing_type,
                "purpose": term.purpose,
                "labelDescription": term.description,
                "hostPermissions": term.host_permissions,
            }

            # Identify direction
            if term.from_Type.lower() == "guest" and term.to_Type.lower() == "host":
                direction = "guest_host"
            elif term.from_Type.lower() == "host" and term.to_Type.lower() == "guest":
                direction = "host_guest"
            else:
                continue  # Skip unknown directions

            # Add to respective categories
            if term.modality == "obligatory":
                obligations[direction].append(term_data)
            elif term.modality == "forbidden":
                forbidden_terms[direction].append(term_data)
            elif term.description == "They can share more data.":
                permissions[direction]["canShareMoreData"] = True
            elif term.description == "They can download data.":
                permissions[direction]["canDownloadData"] = True

        response_data = {
            "template_id": template.global_connection_type_template_id,
            "template_name": template.global_connection_type_name,
            "template_description": template.global_connection_type_description,
            "obligations": obligations,
            "permissions": permissions,
            "forbidden": forbidden_terms,
        }

        return JsonResponse({"success": True, "data": response_data}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Connection_Link_Regulation_For_Connection_Type(request):
    """
    Expected JSON (raw JSON data/form data):
    {
        "connection_Type_ID": value
    }
    """
    if request.method == "GET":
        conn_type_ID = request.data.get("connection_Type_ID")  # RAW JSON DATA/FORM DATA
        link_Regulation = ConnectionTypeRegulationLinkTable.objects.filter(
            connection_type_id=conn_type_ID
        )
        if link_Regulation.exists():
            serializer = ConnectionTypeRegulationLinkTableGetSerializer(
                link_Regulation, many=True
            )
            return JsonResponse({"data": serializer.data})
        return JsonResponse(
            {
                "message": f"Connection regulation link table does not have an entry with connection type ID = {conn_type_ID}"
            }
        )
    return JsonResponse({"message": "The method request is not GET."})


# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# # @role_required(CustomUser.SYS_ADMIN)
# def create_Global_Connection_Terms(request):
#     """
#     Expected JSON (raw JSON data/form data):
#     {
#         "connection_terms_obligations": obligations,
#         "connection_terms_permissions": permissions
#     }
#     """
#     if request.method == "POST":
#         requesting_user: CustomUser = request.user
#         if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
#             return JsonResponse(
#                 {
#                     "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
#                 }
#             )
#         # global_conn_type_id = request.data.get("global_conn_type_id") # RAW JSON DATA/FORM DATA
#         connection_terms_obligations = request.data.get(
#             "connection_terms_obligations"
#         )  # RAW JSON DATA/FORM DATA
#         connection_terms_permissions = request.data.get(
#             "connection_terms_permissions"
#         )  # RAW JSON DATA/FORM DATA
#         print(connection_terms_obligations)

#         # template = GlobalConnectionTypeTemplate.objects.filter(
#         #     global_connection_type_template_id=global_conn_type_id
#         # )
#         # if not template.exists():
#         #     return JsonResponse(
#         #         {
#         #             "message": f"Global connection type template with ID = {global_conn_type_id} does not exist."
#         #         }
#         #     )
#         terms_List: list = []
#         for obligation in connection_terms_obligations:
#             term = ConnectionTerms.objects.create(
#                 # global_conn_type=None,
#                 modality="obligatory",
#                 data_element_name=obligation["labelName"],
#                 data_type=obligation["typeOfAction"],
#                 sharing_type=obligation["typeOfSharing"],
#                 purpose=obligation["purpose"],
#                 description=obligation["labelDescription"],
#                 host_permissions=obligation["hostPermissions"],
#             )
#             terms_List.append(term)

#         can_share_more_data = connection_terms_permissions["canShareMoreData"]
#         can_download_data = connection_terms_permissions["canDownloadData"]

#         if can_share_more_data:
#             term = ConnectionTerms.objects.create(
#                 # global_conn_type=None,
#                 modality="permissive",
#                 description="They can share more data.",
#             )
#             terms_List.append(term)
#         if can_download_data:
#             term = ConnectionTerms.objects.create(
#                 # global_conn_type=None,
#                 modality="permissive",
#                 description="They can download data.",
#             )
#             terms_List.append(term)
#         terms_Serializer = ConnectionTermsSerializer(terms_List, many=True)
#         return JsonResponse(
#             {
#                 "message": "Global connection terms added successfully.",
#                 "terms": terms_Serializer.data,
#             }
#         )
#     else:
#         return JsonResponse({"message": "Request method is not POST."})

# old code
# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def create_Global_Connection_Terms(request):
#     """
#     Expected JSON (raw JSON data/form data):
#     {
#         "connection_terms_obligations": obligations,
#         "connection_terms_permissions": permissions,
#         "forbidden": true/false
#         "from_Type = "from_Type"
#         "to_Type = "to_Type"
#     }
#     """
#     if request.method == "POST":
#         requesting_user: CustomUser = request.user
#         if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
#             return JsonResponse(
#                 {
#                     "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
#                 },
#                 status=403,
#             )

#         try:
#             # Parse the request body (handling both JSON and form data)
#             data = json.loads(request.body)

#             # Retrieve Obligations, Permissions, and Forbidden checkbox from the request
#             connection_terms_obligations = data.get("connection_terms_obligations")
#             connection_terms_permissions = data.get("connection_terms_permissions")
#             forbidden = data.get(
#                 "forbidden", False
#             )  # Forbidden checkbox input (default is False)
#             from_Type = data.get("from_Type")
#             to_Type = data.get("to_Type")

#             # Debugging and Logging
#             print("Received Forbidden Flag:", forbidden)
#             if connection_terms_obligations:
#                 print("Received Obligations:", connection_terms_obligations)
#             if connection_terms_permissions:
#                 print("Received Permissions:", connection_terms_permissions)

#             terms_List: list = []

#             # Handle Obligations
#             if connection_terms_obligations:
#                 for obligation in connection_terms_obligations:
#                     term = ConnectionTerms.objects.create(
#                         modality="obligatory",
#                         data_element_name=obligation["labelName"],
#                         data_type=obligation["typeOfAction"],
#                         sharing_type=obligation["typeOfSharing"],
#                         purpose=obligation.get(
#                             "purpose", ""
#                         ),  # Handle missing purpose field
#                         description=obligation["labelDescription"],
#                         host_permissions=obligation["hostPermissions"],
#                         from_Type = from_Type,
#                         to_Type = to_Type
#                     )
#                     terms_List.append(term)

#             # Handle Permissions
#             can_share_more_data = connection_terms_permissions.get(
#                 "canShareMoreData", False
#             )
#             can_download_data = connection_terms_permissions.get(
#                 "canDownloadData", False
#             )

#             if can_share_more_data:
#                 print("Adding permissive term for sharing more data")
#                 term = ConnectionTerms.objects.create(
#                     modality="permissive",
#                     description="They can share more data.",
#                     from_Type = from_Type,
#                     to_Type = to_Type
#                 )
#                 terms_List.append(term)

#             if can_download_data:
#                 print("Adding permissive term for downloading data")
#                 term = ConnectionTerms.objects.create(
#                     modality="permissive",
#                     description="They can download data.",
#                     from_Type = from_Type,
#                     to_Type = to_Type
#                 )
#                 terms_List.append(term)

#             # Handle Forbidden Terms if the checkbox is checked (True)
#             if forbidden:
#                 print("Adding forbidden term for unaltered connection")
#                 term = ConnectionTerms.objects.create(
#                     modality="forbidden",
#                     description="You cannot unilaterally close the connection.",
#                     from_Type = from_Type,
#                     to_Type = to_Type
#                 )
#                 terms_List.append(term)
#             else:
#                 print("Forbidden flag is False")

#             # Serialize and return the created terms
#             terms_Serializer = ConnectionTermsSerializer(terms_List, many=True)
#             return JsonResponse(
#                 {
#                     "message": "Global connection terms added successfully.",
#                     "terms": terms_Serializer.data,
#                 },
#                 status=201,
#             )

#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON format"}, status=400)

#         except Exception as e:
#             print(f"Exception occurred: {str(e)}")
#             return JsonResponse({"error": str(e)}, status=400)

#     return JsonResponse({"message": "Request method is not POST."}, status=405)

# #recent old
# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def create_Global_Connection_Terms(request):
#     if request.method == "POST":
#         requesting_user: CustomUser = request.user
#         if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
#             return JsonResponse(
#                 {
#                     "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
#                 },
#                 status=403,
#             )

#         try:
#             data = json.loads(request.body)
#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON"}, status=400)

#         # Extract data from request
#         connection_type_name = data.get("connectionName")
#         connection_description = data.get("connectionDescription")
#         globaltype =data.get("globaltype")
#         domain = data.get("domain")
#         connection_terms_obligations = data.get("obligations", [])
#         connection_terms_permissions = data.get("permissions", {})
#         forbidden_checkbox = data.get("forbidden", [])
#         from_Type = data.get("from")
#         to_Type = data.get("to")

#         if not all(
#             [
#                 connection_type_name,
#                 globaltype,
#                 domain,
#                 connection_description,
#                 from_Type,
#                 to_Type,
#             ]
#         ):
#             return JsonResponse(
#                 {"success": False, "error": "All fields are required"}, status=400
#             )

#         # Check if the same connection type already exists in the same direction
        
#         existing_connection = GlobalConnectionTypeTemplate.objects.filter(
#             global_connection_type_name=connection_type_name,
#         ).first()

#         if existing_connection and ConnectionTerms.objects.filter(
#             global_conn_type=existing_connection,
#             from_Type=from_Type,
#             to_Type=to_Type
#         ).exists():
#             return JsonResponse(
#                 {
#                     "success": False,
#                     "error": f"A connection of type '{connection_type_name}' already exists."
#                 },
#                 status=400,
#             )

#         # Create or retrieve the connection type
#         new_global_connection_type, created = GlobalConnectionTypeTemplate.objects.get_or_create(
#             global_connection_type_name=connection_type_name,
#             global_connection_type_description=connection_description,
#             globaltype=globaltype,
#             domain=domain,

#         )

#         # Helper function to create terms for the specified direction
#         def create_terms_for_direction(
#             obligations, permissions, forbidden, direction_from, direction_to
#         ):
#             for obligation in obligations:
#                 global_conn_type_id = obligation.get("global_conn_type_id")
#                 ConnectionTerms.objects.create(
#                     global_conn_type=new_global_connection_type,  # Use global_conn_type instead of conn_type
#                     modality="obligatory",
#                     data_element_name=obligation["labelName"],
#                     data_type=obligation["typeOfAction"],
#                     sharing_type=obligation["typeOfSharing"],
#                     purpose=obligation.get("purpose", ""),
#                     description=obligation["labelDescription"],
#                     host_permissions=obligation.get("hostPermissions", []),
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             # Permissive terms
#             if permissions.get("canShareMoreData", False):
#                 ConnectionTerms.objects.create(
#                     global_conn_type=new_global_connection_type,  # Use global_conn_type
#                     modality="permissive",
#                     description="They can share more data.",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             if permissions.get("canDownloadData", False):
#                 ConnectionTerms.objects.create(
#                     global_conn_type=new_global_connection_type,  # Use global_conn_type
#                     modality="permissive",
#                     description="They can download data.",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#             # Forbidden terms
#             if forbidden and "Cannot close unilaterally" in forbidden:
#                 ConnectionTerms.objects.create(
#                     global_conn_type=new_global_connection_type,  # Use global_conn_type
#                     modality="forbidden",
#                     description="You cannot unilaterally close the connection",
#                     from_Type=direction_from,
#                     to_Type=direction_to,
#                 )

#         # Create terms only in the specified direction (from_Type to to_Type)
#         create_terms_for_direction(
#             connection_terms_obligations,
#             connection_terms_permissions,
#             forbidden_checkbox,
#             from_Type,
#             to_Type,
#         )

#         return JsonResponse(
#             {
#                 "success": True,
#                 "connection_type_message": "Global Connection Type successfully created",
#                 "connection_terms_message": "Global connection terms added successfully.",
#             },
#             status=201,
#         )

#new code  for create-gobal connection and terms 
@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_Global_Connection_Terms(request):
    if request.method == "POST":
        requesting_user: CustomUser = request.user
        if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
            return JsonResponse(
                {
                    "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
                },
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        # Extract general data
        connection_type_name = data.get("connectionName")
        connection_description = data.get("connectionDescription")
        globaltype = data.get("globaltype")
        domain = data.get("domain")
        directions = data.get("directions", [])

        if not all([connection_type_name, globaltype, domain, connection_description, directions]):
            return JsonResponse(
                {"success": False, "error": "All fields are required including directions"}, status=400
            )

        # Check if the connection type exists
        existing_connection = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_name=connection_type_name,
        ).first()

        if existing_connection:
            for direction in directions:
                from_Type = direction.get("from")
                to_Type = direction.get("to")
                if ConnectionTerms.objects.filter(
                    global_conn_type=existing_connection,
                    from_Type=from_Type,
                    to_Type=to_Type
                ).exists():
                    return JsonResponse(
                        {
                            "success": False,
                            "error": f"Direction from {from_Type} to {to_Type} already exists for '{connection_type_name}'"
                        },
                        status=400,
                    )

        # Create or retrieve the connection type
        new_global_connection_type, _ = GlobalConnectionTypeTemplate.objects.get_or_create(
            global_connection_type_name=connection_type_name,
            global_connection_type_description=connection_description,
            globaltype=globaltype,
            domain=domain,
        )

        # Helper function
        def create_terms_for_direction(obligations, permissions, forbidden, direction_from, direction_to):
            for obligation in obligations:
                global_conn_type_id = obligation.get("global_conn_type_id")
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="obligatory",
                    data_element_name=obligation["labelName"],
                    data_type=obligation["typeOfAction"],
                    sharing_type=obligation["typeOfSharing"],
                    purpose=obligation.get("purpose", ""),
                    description=obligation["labelDescription"],
                    host_permissions=obligation.get("hostPermissions", []),
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canShareMoreData", False):
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="permissive",
                    description="They can share more data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canDownloadData", False):
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="permissive",
                    description="They can download data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if forbidden and "Cannot close unilaterally" in forbidden:
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="forbidden",
                    description="You cannot unilaterally close the connection",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

        # Loop through each direction and create terms
        for direction in directions:
            from_Type = direction.get("from")
            to_Type = direction.get("to")
            obligations = direction.get("obligations", [])
            permissions = direction.get("permissions", {})
            forbidden = direction.get("forbidden", [])

            if not (from_Type and to_Type):
                return JsonResponse({"success": False, "error": "Each direction must include 'from' and 'to'"}, status=400)

            create_terms_for_direction(obligations, permissions, forbidden, from_Type, to_Type)

        return JsonResponse(
            {
                "success": True,
                "connection_type_message": "Global Connection Type successfully created",
                "connection_terms_message": "Global connection terms added for all directions.",
            },
            status=201,
        )


@csrf_exempt
@api_view(["PUT", "DELETE"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Locker(request: HttpRequest):
    if request.method == "DELETE":
        """
        Expected JSON data(raw JSON data/form data):
        {
            "locker_name": value
        }
        """
        user: CustomUser = request.user
        locker_name = request.data.get("locker_name")

        if not locker_name:
            return JsonResponse({"message": "Locker name is not provided."}, status=400)

        locker_to_be_deleted = Locker.objects.filter(name=locker_name, user=user)

        if locker_to_be_deleted.exists():
            delete_locker = locker_to_be_deleted.first()
            delete_locker.delete()
            return JsonResponse(
                {
                    "message": f"Locker(ID = {delete_locker.locker_id}) with name = {locker_name} of user with username = {user.username} was successfully deleted."
                },
                status=200,
            )
        else:
            return JsonResponse(
                {"message": f"Locker with name = {locker_name} does not exist."},
                status=404,
            )

    elif request.method == "PUT":
        """
        Expected JSON data (raw JSON data/form data):
        {
            "locker_name": value,
            "new_locker_name": value,
            "description": value
        }
        """
        data = request.data
        locker_name = data.get("locker_name")
        new_locker_name = data.get("new_locker_name")
        new_description = data.get("description")
        is_frozen = data.get("is_frozen")

        if not locker_name:
            return JsonResponse(
                {"success": False, "error": "Locker name must be provided."}, status=400
            )

        locker = Locker.objects.filter(name=locker_name, user=request.user).first()
        if locker:
            if new_locker_name:
                locker.name = new_locker_name
            if new_description:
                locker.description = new_description
            if is_frozen is not None:
                locker.is_frozen = is_frozen
            locker.save()

            return JsonResponse({"message": "Locker updated successfully."})
        else:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Locker with name = {locker_name} does not exist.",
                },
                status=404,
            )

    else:
        return JsonResponse({"message": "Request method should be either POST or PUT."})



@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def reshare_Allowed_Or_Not(request: HttpRequest) -> JsonResponse:
    """
    {
        "connection_id": value
    }
    """
    connection_id = request.GET.get("connection_id")
    connections = Connection.objects.filter(connection_id=connection_id)
    if connections.exists():
        connection = connections.first()
        terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
        if terms.exists():
            term = terms.first()
            if "reshare" in term.host_permissions:
                return JsonResponse({"boolean_value": True})
            return JsonResponse({"boolean_value": False})
        return JsonResponse(
            {
                "message": f"Connection terms do not exist for connection type = {connection.connection_type.connection_type_name}"
            }
        )
    return JsonResponse(
        {"message": f"Connection with ID = {connection_id} does not exist."}
    )



@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_for_user(request):
    if request.method == "GET":
        host_user_username = request.GET.get("host_user_username")  # Host username
        host_locker_name = request.GET.get("host_locker_name")  # Host locker name
        guest_user_username = request.GET.get("guest_user_username")  # Guest username
        guest_locker_name = request.GET.get("guest_locker_name")  # Guest locker name
        connection_name = request.GET.get("connection_name")

        # Validate required parameters
        if not all(
            [
                host_user_username,
                host_locker_name,
                guest_user_username,
                guest_locker_name,
                connection_name,
            ]
        ):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Host user, guest user, host locker, guest locker, and connection name are required",
                },
                status=400,
            )

        try:
            # Fetch host user and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.filter(
                name=host_locker_name, user=host_user
            ).first()
            if not host_locker:
                return JsonResponse(
                    {"success": False, "error": "Host locker not found"}, status=404
                )

            # Fetch guest user and locker
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.filter(
                name=guest_locker_name, user=guest_user
            ).first()
            if not guest_locker:
                return JsonResponse(
                    {"success": False, "error": "Guest locker not found"}, status=404
                )

            # Fetch the connection based on host and guest details
            connection = Connection.objects.filter(
                connection_name=connection_name,
                host_user=host_user,
                guest_user=guest_user,
                host_locker=host_locker,
                guest_locker=guest_locker,
            ).first()
            if not connection:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Fetch terms and separate them by modality and direction
            connection_type = connection.connection_type
            terms = ConnectionTerms.objects.filter(conn_type=connection_type)

            obligations = {"host_to_guest": [], "guest_to_host": []}
            permissions = {
                "host_to_guest": {"canShareMoreData": False, "canDownloadData": False},
                "guest_to_host": {"canShareMoreData": False, "canDownloadData": False},
            }

            # Retrieve terms_value and terms_value_reverse for obligations
            terms_value = connection.terms_value  # Guest to Host
            terms_value_reverse = connection.terms_value_reverse  # Host to Guest

            for term in terms:
                # Filter obligatory terms for obligations
                if term.modality == "obligatory":
                    term_data = {
                        "labelName": term.data_element_name,
                        "typeOfAction": term.data_type,
                        "typeOfSharing": term.sharing_type,
                        "purpose": term.purpose,
                        "labelDescription": term.description,
                        "hostPermissions": term.host_permissions,
                        "from": term.from_Type,
                        "to": term.to_Type,
                        "terms_id":term.terms_id
                    }

                    # Assign values based on direction
                    if term.from_Type == "GUEST" and term.to_Type == "HOST":
                        term_data["value"] = terms_value.get(
                            term.data_element_name, None
                        )
                        obligations["guest_to_host"].append(term_data)
                    elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                        term_data["value"] = terms_value_reverse.get(
                            term.data_element_name, None
                        )
                        obligations["host_to_guest"].append(term_data)

                # Handle permissive terms for permissions
                elif term.modality == "permissive":
                    if term.description == "They can share more data.":
                        if term.from_Type == "GUEST" and term.to_Type == "HOST":
                            permissions["guest_to_host"]["canShareMoreData"] = True
                        elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                            permissions["host_to_guest"]["canShareMoreData"] = True
                    elif term.description == "They can download data.":
                        if term.from_Type == "GUEST" and term.to_Type == "HOST":
                            permissions["guest_to_host"]["canDownloadData"] = True
                        elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                            permissions["host_to_guest"]["canDownloadData"] = True

            # Prepare response data
            response_data = {
                "connectionName": connection.connection_name,
                "connectionDescription": connection.connection_description,
                "lockerName": (
                    host_locker_name if request.user == host_user else guest_locker_name
                ),
                "obligations": obligations,
                "permissions": permissions,
            }

            return JsonResponse({"success": True, "terms": response_data}, status=200)

        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {str(e)}"}, status=404
            )
        except Exception as e:
            print(f"Exception occurred: {e}")
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_to_locker(request):
    try:
        guest_username = request.user.username  # the user is authenticated
        host_username = request.query_params.get("host_username")
        host_locker_name = request.query_params.get("host_locker_name")

        if not host_username or not host_locker_name:
            return Response(
                {"success": False, "message": "Missing required parameters"}, status=400
            )

        # Filter connections where guest is the current user and host matches the given locker
        connections = Connection.objects.filter(
            guest_user__username=guest_username,
            host_user__username=host_username,
            host_locker__name=host_locker_name,
            connection_status__in=["established", "live"]
        )

        # Serialize the data
        serializer = ConnectionSerializer(connections, many=True)

        return Response({"success": True, "connections": serializer.data}, status=200)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


# @csrf_exempt
# @api_view(["PUT", "DELETE"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def edit_delete_connectiontype_details(request):
#     """
#     Edit or delete ConnectionType and ConnectionTerms associated with a connection type.

#     For Editing:
#     Expected JSON (PUT request):
#     {
#         "connection_type_id": <value>,
#         "connection_type_name": <new connection type name>,
#         "connection_type_description": <new connection type description>,
#         "terms": [
#             {
#                 "terms_id": <term_id>,
#                 "data_element_name": <new term name>
#             }
#         ]
#     }

#     For Deletion:
#     Expected JSON (DELETE request):
#     {
#         "connection_type_id": <value>
#     }

#     Returns:
#     - Success or error message.
#     """
#     if request.method == "PUT":
#         try:
#             data = json.loads(request.body)
#             connection_type_id = data.get("connection_type_id")
#             new_connection_type_name = data.get("connection_type_name")
#             new_connection_type_description = data.get("connection_type_description")
#             terms = data.get("terms", [])

#             if not connection_type_id or not new_connection_type_name:
#                 return JsonResponse(
#                     {
#                         "success": False,
#                         "error": "ConnectionType ID and new connection type name are required",
#                     },
#                     status=400,
#                 )

#             # Fetch the ConnectionType
#             connection_type = ConnectionType.objects.get(
#                 connection_type_id=connection_type_id
#             )

#             # Update ConnectionType name and description
#             connection_type.connection_type_name = new_connection_type_name
#             if new_connection_type_description:
#                 connection_type.connection_description = new_connection_type_description
#             connection_type.save()

#             # Update terms names if provided
#             for term in terms:
#                 term_id = term.get("terms_id")
#                 new_term_name = term.get("data_element_name")
#                 new_term_desc = term.get("description")
#                 new_term_purpose = term.get("purpose")
#                 if term_id and new_term_name:
#                     connection_term = ConnectionTerms.objects.get(terms_id=term_id)
#                     connection_term.data_element_name = new_term_name
#                     connection_term.description = new_term_desc
#                     connection_term.purpose = new_term_purpose
#                     connection_term.save()

#             return JsonResponse(
#                 {
#                     "success": True,
#                     "message": "Connection type and terms updated successfully",
#                 },
#                 status=200,
#             )

#         except ConnectionType.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "ConnectionType not found"}, status=404
#             )
#         except ConnectionTerms.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "Connection term not found"}, status=404
#             )
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)}, status=400)

#     elif request.method == "DELETE":
#         try:
#             data = json.loads(request.body)
#             connection_type_id = data.get("connection_type_id")

#             if not connection_type_id:
#                 return JsonResponse(
#                     {"success": False, "error": "ConnectionType ID is required"},
#                     status=400,
#                 )

#             # Fetch the ConnectionType
#             connection_type = ConnectionType.objects.get(
#                 connection_type_id=connection_type_id
#             )

#             # Delete the ConnectionType
#             connection_type.delete()

#             return JsonResponse(
#                 {"success": True, "message": "ConnectionType deleted successfully"},
#                 status=200,
#             )

#         except ConnectionType.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "ConnectionType not found"}, status=404
#             )
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)}, status=400)


#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )
@csrf_exempt
@api_view(["PUT", "DELETE"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def edit_delete_connectiontype_details(request):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            connection_type_id = data.get("connection_type_id")
            new_connection_type_name = data.get("connection_type_name")
            new_connection_type_description = data.get("connection_type_description")
            terms = data.get("terms", [])

            if not connection_type_id or not new_connection_type_name:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "ConnectionType ID and new connection type name are required",
                    },
                    status=400,
                )

            # Fetch the ConnectionType
            connection_type = ConnectionType.objects.get(
                connection_type_id=connection_type_id
            )

            # Store old name before changing it
            old_connection_type_name = connection_type.connection_type_name

            # Update ConnectionType name and description
            connection_type.connection_type_name = new_connection_type_name
            if new_connection_type_description:
                connection_type.connection_description = new_connection_type_description
            connection_type.save()

            # Update terms names if provided
            for term in terms:
                term_id = term.get("terms_id")
                new_term_name = term.get("data_element_name")
                new_term_desc = term.get("description")
                new_term_purpose = term.get("purpose")
                if term_id and new_term_name:
                    connection_term = ConnectionTerms.objects.get(terms_id=term_id)
                    connection_term.data_element_name = new_term_name
                    connection_term.description = new_term_desc
                    connection_term.purpose = new_term_purpose
                    connection_term.save()

            # Update existing Connections' connection_name where connection_type is this one
            connections = Connection.objects.filter(connection_type=connection_type)

            for connection in connections:
                # Update connection_name by replacing the old connection type name with the new one
                connection.connection_name = connection.connection_name.replace(
                    old_connection_type_name, new_connection_type_name
                )
                connection.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": "Connection type and terms updated successfully. Existing connections updated.",
                },
                status=200,
            )

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionType not found"}, status=404
            )
        except ConnectionTerms.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection term not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    elif request.method == "DELETE":
        try:
            data = json.loads(request.body)
            connection_type_id = data.get("connection_type_id")

            if not connection_type_id:
                return JsonResponse(
                    {"success": False, "error": "ConnectionType ID is required"},
                    status=400,
                )

            # Fetch the ConnectionType
            connection_type = ConnectionType.objects.get(
                connection_type_id=connection_type_id
            )

            # Delete the ConnectionType
            connection_type.delete()

            return JsonResponse(
                {"success": True, "message": "ConnectionType deleted successfully"},
                status=200,
            )

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionType not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_termsONLY(request):
    """
    Update specific fields in ConnectionTerms.

    Request Body:
    {
        "terms_id": 60,
        "modality": "obligatory",
        "host_permissions":["reshare","download"],
        "sharing_type":"Transfer",
        "data_type": "file",
        "data_element_name":"markscard"
    }

    Returns:
    - JsonResponse: A JSON object containing the updated ConnectionTerms data or an error message.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

        terms_id = data.get("terms_id")
        if not terms_id:
            return JsonResponse(
                {"success": False, "error": "terms_id is required"}, status=400
            )

        try:
            connection_term = ConnectionTerms.objects.get(terms_id=terms_id)
        except ConnectionTerms.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionTerms entry not found"},
                status=404,
            )

        # Update only the fields provided in the request
        if "modality" in data:
            connection_term.modality = data.get("modality")
        if "host_permissions" in data:
            connection_term.host_permissions = data.get("host_permissions")
        if "sharing_type" in data:
            connection_term.sharing_type = data.get("sharing_type")
        if "data_type" in data:
            connection_term.data_type = data.get("data_type")
        if "data_element_name" in data:
            connection_term.data_element_name = data.get("data_element_name")

        connection_term.save()

        # Prepare the response
        response_data = {
            "terms_id": connection_term.terms_id,
            "modality": connection_term.modality,
            "host_permissions": connection_term.host_permissions,
            "sharing_type": connection_term.sharing_type,
            "data_type": connection_term.data_type,
            "data_element_name": connection_term.data_element_name,
        }

        return JsonResponse(
            {"success": True, "connection_term": response_data}, status=200
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revoke_host(request: HttpRequest) -> JsonResponse:
    """
    "connection_id": value,
    "revoke_host_bool": value
    """
    if request.method == "POST":
        connection_id = request.POST.get("connection_id")
        if connection_id is None:
            return JsonResponse({"message": "Connection ID cannot be None."})
        connection_List = Connection.objects.filter(connection_id=connection_id)
        if connection_List.exists():
            connection = connection_List.first()
            if connection.revoke_guest == False:
                return JsonResponse({"message": "Guest has not yet revoked."})
            revoke_host = request.POST.get("revoke_host_bool", None)
            if revoke_host is None:
                return JsonResponse({"message": f"Revoke host is {revoke_host}"})
            connection.revoke_host = revoke_host
            connection.save()
        else:
            return JsonResponse(
                {"message": f"Connection with ID = {connection_id} does not exist."}
            )
        return JsonResponse({"message": "Revoke host updated successfully."})


# Logs - Logging mechanism must be made. Everything should be logged.


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_consent_status(request):
    """
    Get consent status for a specific connection.

    Query Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.

    Returns:
    - JsonResponse: A JSON object containing consent status, consent given date, and validity date.

    Response Codes:
    - 200: Successful retrieval of consent status.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: Request User not authenticated.
    - 404: Specified connection, user, or locker not found.
    - 405: Request method not allowed (if not GET).
    """
    if request.method != "GET":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    connection_name = request.GET.get("connection_name")
    connection_type_id = request.GET.get("connection_type_id")
    guest_username = request.GET.get("guest_username")
    guest_lockername = request.GET.get("guest_lockername")
    host_username = request.GET.get("host_username")
    host_lockername = request.GET.get("host_lockername")

    if None in [
        connection_name,
        connection_type_id,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Fetch the connection type
        try:
            connection_type = ConnectionType.objects.get(
                connection_type_id=connection_type_id
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection type not found"}, status=404
            )

        # Fetch the connection
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type=connection_type,
                guest_user=guest_user,
                host_user=host_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        consent_status = connection.requester_consent
        consent_given = connection.consent_given
        validity_date = connection.validity_time

        return JsonResponse(
            {
                "success": True,
                "connection_name": connection_name,
                "connection_type_name": connection_type.connection_type_name,
                "consent_status": consent_status,
                "consent_given": (
                    consent_given.strftime("%B %d, %Y, %I:%M %p")
                    if consent_given
                    else "Not provided"
                ),
                "valid_until": (
                    validity_date.strftime("%B %d, %Y, %I:%M %p")
                    if validity_date
                    else "Not provided"
                ),
            },
            status=200,
        )

    except CustomUser.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": "User not found: {}".format(str(e))}, status=404
        )
    except Locker.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": "Locker not found: {}".format(str(e))},
            status=404,
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "error": "An error occurred: {}".format(str(e))},
            status=400,
        )



#     return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_by_connection_type(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_user_username = request.GET.get("host_user_username")
        host_locker_name = request.GET.get("host_locker_name")
        guest_user_username = request.GET.get("guest_user_username")
        guest_locker_name = request.GET.get("guest_locker_name")

        # Validate required parameters
        if not all([connection_type_name, host_user_username, host_locker_name]):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Host user, locker, and connection type name are required",
                },
                status=400,
            )

        try:
            # Get the host user and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)

            # Optionally get guest user and locker
            guest_user = None
            guest_locker = None
            if guest_user_username and guest_locker_name:
                guest_user = CustomUser.objects.get(username=guest_user_username)
                guest_locker = Locker.objects.get(
                    name=guest_locker_name, user=guest_user
                )

            # Get the connection type
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_user=host_user,
                owner_locker=host_locker,
            )

            # Get terms related to the connection type
            terms = ConnectionTerms.objects.filter(conn_type=connection_type)

            if not terms.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No terms found for the given connection type",
                    },
                    status=404,
                )

            # Separate terms by modality and direction
            obligations_guest_to_host = []
            obligations_host_to_guest = []
            permissions_guest_to_host = {
                "canShareMoreData": False,
                "canDownloadData": False,
            }
            permissions_host_to_guest = {
                "canShareMoreData": False,
                "canDownloadData": False,
            }
            forbidden_guest_to_host = []
            forbidden_host_to_guest = []

            for term in terms:
                term_data = {
                    "terms_id": term.terms_id,
                    "global_conn_type_id": term.global_conn_type_id,
                    "labelName": term.data_element_name,
                    "typeOfAction": term.data_type,
                    "typeOfSharing": term.sharing_type,
                    "purpose": term.purpose,
                    "labelDescription": term.description,
                    "hostPermissions": term.host_permissions,
                }

                # Obligations
                if term.modality == "obligatory":
                    if (
                        term.from_Type == ConnectionTerms.TermFromTo.GUEST
                        and term.to_Type == ConnectionTerms.TermFromTo.HOST
                    ):
                        obligations_guest_to_host.append(term_data)
                    elif (
                        term.from_Type == ConnectionTerms.TermFromTo.HOST
                        and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                    ):
                        obligations_host_to_guest.append(term_data)

                # Permissions
                elif term.modality == "permissive":
                    if term.description == "They can share more data.":
                        if (
                            term.from_Type == ConnectionTerms.TermFromTo.GUEST
                            and term.to_Type == ConnectionTerms.TermFromTo.HOST
                        ):
                            permissions_guest_to_host["canShareMoreData"] = True
                        elif (
                            term.from_Type == ConnectionTerms.TermFromTo.HOST
                            and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                        ):
                            permissions_host_to_guest["canShareMoreData"] = True
                    elif term.description == "They can download data.":
                        if (
                            term.from_Type == ConnectionTerms.TermFromTo.GUEST
                            and term.to_Type == ConnectionTerms.TermFromTo.HOST
                        ):
                            permissions_guest_to_host["canDownloadData"] = True
                        elif (
                            term.from_Type == ConnectionTerms.TermFromTo.HOST
                            and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                        ):
                            permissions_host_to_guest["canDownloadData"] = True

                # Forbidden terms
                elif term.modality == "forbidden":
                    if (
                        term.from_Type == ConnectionTerms.TermFromTo.GUEST
                        and term.to_Type == ConnectionTerms.TermFromTo.HOST
                    ):
                        forbidden_guest_to_host.append(term_data)
                    elif (
                        term.from_Type == ConnectionTerms.TermFromTo.HOST
                        and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                    ):
                        forbidden_host_to_guest.append(term_data)

            # Prepare response data
            response_data = {
                "connection_type_id": connection_type.connection_type_id,
                "connection_type_name": connection_type.connection_type_name,
                "connection_type_description": connection_type.connection_description,
                "post_conditions": connection_type.post_conditions,
                "host_user": host_user.username,
                "host_locker": host_locker.name,
                "obligations": {
                    "guest_to_host": obligations_guest_to_host,
                    "host_to_guest": obligations_host_to_guest,
                },
                "permissions": {
                    "guest_to_host": permissions_guest_to_host,
                    "host_to_guest": permissions_host_to_guest,
                },
                "forbidden": {
                    "guest_to_host": forbidden_guest_to_host,
                    "host_to_guest": forbidden_host_to_guest,
                },
            }

            # Add guest details if provided
            if guest_user and guest_locker:
                response_data["guest_user"] = guest_user.username
                response_data["guest_locker"] = guest_locker.name

            return JsonResponse({"success": True, "data": response_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Host user not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Host locker not found"}, status=404
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection type not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def reshare_Xnode_Check(request: HttpRequest) -> JsonResponse:
#     """
#     Expected JSON data(form data):
#     {
#         "xnode_id": value
#     }
#     """
#     if request.method != "POST":
#         return JsonResponse(
#             {"message": f"POST method allowed but got {request.method}."}
#         )
#     xnode_id = request.POST.get("xnode_id")
#     xnode_List = Xnode.objects.filter(id=xnode_id)
#     if xnode_List.exists():
#         xnode = xnode_List.first()
#         connection_Type = xnode.connection.connection_type
#         if connection_Type is None:
#             link_Table_List = ConnectionTypeRegulationLinkTable.objects.filter(
#                 connection_type_id=connection_Type
#             )
#             global_Template = link_Table_List.first().global_connection_template_id
#             connection_Global_Terms_List = ConnectionTerms.objects.filter(
#                 global_conn_type=global_Template
#             )
#             if connection_Global_Terms_List.exists():
#                 global_Term = connection_Global_Terms_List.first()
#                 if "reshare" in global_Term.host_permissions:
#                     return JsonResponse({"allowed": True})
#                 else:
#                     return JsonResponse({"allowed": False})
#             else:
#                 return JsonResponse(
#                     {"message": "Connection type is neither non global nor global."}
#                 )
#         else:
#             connection_Terms_List = ConnectionTerms.objects.filter(
#                 conn_type=connection_Type
#             )
#             if connection_Terms_List.exists():
#                 term = connection_Terms_List.first()
#                 if "reshare" in term.host_permissions:
#                     return JsonResponse({"allowed": True})
#                 else:
#                     return JsonResponse({"allowed": False})
#             else:
#                 return JsonResponse(
#                     {
#                         "message": f"The connection has connection type (ID = {connection_Type.connection_type_id}) which does not have any connection terms associated with it."
#                     }
#                 )
#     else:
#         return JsonResponse({"message": f"Xnode with ID = {xnode_id} does not exist."})



@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_extra_data(request):
    """
    API to get the terms stored under the 'canShareMoreData' key in the terms_value of a connection.

    Query Parameters:
    - connection_id: ID of the connection

    Returns:
    - JsonResponse: Contains the terms under the 'canShareMoreData' key from both host and guest.
    """
    # Get the connection_id from the request query parameters
    connection_id = request.GET.get("connection_id", None)
    print("connection id", connection_id)

    if not connection_id:
        return JsonResponse({"error": "connection_id is required"}, status=400)

    try:
        # Fetch the connection object
        connection = Connection.objects.get(connection_id=connection_id)

        print("connection", connection)

        # Extract the terms_value from the connection
        terms_value = connection.terms_value or {}  # Default to empty dict if None
        terms_value_reverse = connection.terms_value_reverse or {}  # Default to empty dict if None
        print("terms_value:", terms_value)
        print("terms_value_reverse:", terms_value_reverse)

        # Extract 'canShareMoreData' from both dictionaries if it exists
        shared_more_data_terms = terms_value.get("canShareMoreData", None)
        shared_more_data_terms_reverse = terms_value_reverse.get("canShareMoreData", None)

        # If both are missing, return an error
        if shared_more_data_terms is None and shared_more_data_terms_reverse is None:
            return JsonResponse(
                {"error": "'canShareMoreData' not found in both terms_value and terms_value_reverse"},
                status=404,
            )

        # Return the terms, even if one is None
        return JsonResponse(
            {
                "success": True,
                "shared_more_data_terms": shared_more_data_terms,
                "shared_more_data_terms_reverse": shared_more_data_terms_reverse,
            },
            status=200,
        )

    except Connection.DoesNotExist:
        return JsonResponse({"error": "Connection not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_extra_data(request):
    """
    API to get the terms stored under the 'canShareMoreData' key in the terms_value of a connection.

    Query Parameters:
    - connection_id: ID of the connection

    Returns:
    - JsonResponse: Contains the terms under the 'canShareMoreData' key from both host and guest.
    """
    # Get the connection_id from the request query parameters
    connection_id = request.GET.get("connection_id", None)
    print("connection id", connection_id)

    if not connection_id:
        return JsonResponse({"error": "connection_id is required"}, status=400)

    try:
        # Fetch the connection object
        connection = Connection.objects.get(connection_id=connection_id)

        print("connection", connection)

        # Extract the terms_value from the connection
        terms_value = connection.terms_value or {}  # Default to empty dict if None
        terms_value_reverse = connection.terms_value_reverse or {}  # Default to empty dict if None
        print("terms_value:", terms_value)
        print("terms_value_reverse:", terms_value_reverse)

        # Extract 'canShareMoreData' from both dictionaries if it exists
        shared_more_data_terms = terms_value.get("canShareMoreData", None)
        shared_more_data_terms_reverse = terms_value_reverse.get("canShareMoreData", None)

        # If both are missing, return an error
        if shared_more_data_terms is None and shared_more_data_terms_reverse is None:
            return JsonResponse(
                {"error": "'canShareMoreData' not found in both terms_value and terms_value_reverse"},
                status=404,
            )

        # Return the terms, even if one is None
        return JsonResponse(
            {
                "success": True,
                "shared_more_data_terms": shared_more_data_terms,
                "shared_more_data_terms_reverse": shared_more_data_terms_reverse,
            },
            status=200,
        )

    except Connection.DoesNotExist:
        return JsonResponse({"error": "Connection not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def get_outgoing_connections_user(request):
#     """
#     Retrieve all outgoing connections of the user where the user is the guest.

#     Query Parameters:
#     - guest_username: The username of the guest user.

#     Returns:
#     - JsonResponse: A JSON object containing the outgoing connections or an error message.

#     Response Codes:
#         - 200: Successful retrieval of outgoing connections.
#         - 401: User is not authenticated.
#         - 404: No outgoing connections found.
#         - 405: Request method not allowed (if not GET).
#     """
#     if request.method == "GET":
#         guest_username = request.GET.get("guest_username")

#         if not guest_username:
#             return JsonResponse(
#                 {"success": False, "error": "guest_username is required"}, status=400
#             )

#         try:
#             # Get the guest user based on the username
#             guest_user = CustomUser.objects.get(username=guest_username)

#             # Get all outgoing connections where the guest_user is the specified user
#             connections = Connection.objects.filter(guest_user=guest_user)

#             if not connections.exists():
#                 return JsonResponse(
#                     {"success": False, "message": "No outgoing connections found."},
#                     status=404,
#                 )

#             # Serializing the connection data
#             outgoing_connections = [
#                 {
#                     "connection_id": connection.connection_id,
#                     "connection_name": connection.connection_name,
#                     "host_user": connection.host_user.username,
#                     "host_locker": connection.host_locker.name,
#                     "guest_locker": connection.guest_locker.name,
#                     "connection_description": connection.connection_description,
#                     "created_on": connection.created_time.strftime("%Y-%m-%d %H:%M:%S"),
#                     "validity_time": connection.validity_time.strftime(
#                         "%Y-%m-%d %H:%M:%S"
#                     ),
#                     "requester_consent": connection.requester_consent,
#                 }
#                 for connection in connections
#             ]

#             return JsonResponse(
#                 {"success": True, "outgoing_connections": outgoing_connections},
#                 status=200,
#             )

#         except CustomUser.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "Guest user not found"}, status=404
#             )
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)}, status=400)

#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )




@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_user(request):
    """
    Retrieve all outgoing connections of the user where the user is the guest.
    Query Parameters:
    - guest_username: The username of the guest user.
    Returns:
    - JsonResponse: A JSON object containing the outgoing connections or an error message.
    Response Codes:
    - 200: Successful retrieval of outgoing connections.
    - 401: User is not authenticated.
    - 404: No outgoing connections found.
    - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        guest_username = request.GET.get("guest_username")
        if not guest_username:
            return JsonResponse(
                {"success": False, "error": "guest_username is required"}, 
                status=400
            )

        try:
            # Get the guest user based on the username
            guest_user = CustomUser.objects.get(username=guest_username)

            # Get all outgoing connections where the guest_user is the specified user
            connections = Connection.objects.filter(guest_user=guest_user)
            
            if not connections.exists():
                return JsonResponse(
                    {"success": False, "message": "No outgoing connections found."},
                    status=404,
                )

            # Fetch all lockers for the guest user
            guest_lockers = Locker.objects.filter(user=guest_user)

            # Accumulate outgoing connections data
           # all_locker_connections = []
            
            for locker in guest_lockers:
                # Get outgoing connections for each locker
                outgoing_connections = Connection.objects.filter(
                    guest_user=guest_user,  # Changed from request.user to guest_user
                    guest_locker=locker
                )
                
                # Only add to response if there are connections for this locker
                if outgoing_connections.exists():
                    outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

                    # Return all accumulated data
                    return JsonResponse(
                        {
                            "success": True, 
                            "outgoing_connections": outgoing_serializer.data
                        },
                        status=200,
                    )
        
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Guest user not found"}, 
                status=404
            )
        except Exception as e:
            return JsonResponse(
                {"success": False, "error": str(e)}, 
                status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, 
        status=405
    )


def home(request: HttpRequest) -> HttpResponse:
    return HttpResponse("<h1>HELLO</h1>")


@csrf_exempt
@api_view(["GET, PUT, DELETE"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def global_Connection_CRUD(request: HttpRequest) -> JsonResponse:
    if request.method == "GET":
        """
        "global_connection_id": value
        """
        global_connection_id = request.GET.get("global_connection_id", None)
        if global_connection_id is None:
            global_List = GlobalConnectionTypeTemplate.objects.all()
            serializer = GlobalConnectionTypeTemplateGetSerializer(
                global_List, many=True
            )
            return JsonResponse({"templates": serializer.data})
        else:
            try:
                global_connection = GlobalConnectionTypeTemplate.objects.get(
                    global_connection_type_template_id=global_connection_id
                )
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_connection
                )
                return JsonResponse({"global_template": serializer.data})
            except GlobalConnectionTypeTemplate.DoesNotExist:
                return JsonResponse(
                    {
                        "message": f"Global connection template with ID = {global_connection_id} does not exist."
                    }
                )
    elif request.method == "PUT":
        """
        "global_connection_id": value,
        "name": value,
        "description": value
        """
        global_connection_id = request.data.get("global_connection_id", None)
        name = request.data.get("name", None)
        description = request.data.get("description", None)
        if global_connection_id is None:
            return JsonResponse({"message": "Global connection ID cannot be None."})
        try:
            global_Connection_Template = GlobalConnectionTypeTemplate.objects.get(
                global_connection_type_template_id=global_connection_id
            )
            global_Connection_Template.global_connection_type_name = name
            global_Connection_Template.global_connection_type_description = description
            global_Connection_Template.save()
            return JsonResponse(
                {"message": "Global connection template updated successfully."},
                status=status.HTTP_200_OK,
            )
        except GlobalConnectionTypeTemplate.DoesNotExist:
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {global_connection_id} does not exist."
                }
            )
    elif request.method == "DELETE":
        """
        "global_connection_id": value
        """
        global_connection_id = request.data.get("global_connection_id", None)
        if global_connection_id is None:
            return JsonResponse({"message": "Global connection ID should not be None."})
        try:
            global_Connection_Template = GlobalConnectionTypeTemplate.objects.get(
                global_connection_type_template_id=global_connection_id
            )
            id_Deleted = global_Connection_Template.global_connection_type_template_id
            global_Connection_Template.delete()
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {id_Deleted} deleted successfully."
                }
            )
        except GlobalConnectionTypeTemplate.DoesNotExist:
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {global_connection_id} does not exist."
                }
            )
    else:
        return JsonResponse(
            {
                "message": f"Supported request methods are DELETE, GET and PUT but got request method as {request.method}."
            }
        )

# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def download_resource(request: HttpRequest):
#     if request.method == "POST":
#         try:
#             # Parse JSON input
#             body = json.loads(request.body)
#             print("Received request body:", body)

#             # Extract required fields from the request body
#             connection_name = body.get("connection_name")
#             host_locker_name = body.get("host_locker_name")
#             guest_locker_name = body.get("guest_locker_name")
#             host_user_username = body.get("host_user_username")
#             guest_user_username = body.get("guest_user_username")
#             document_name = body.get("document_name")
#             sharing_type = body.get("sharing_type")
#             xnode_id = body.get("xnode_id")  # Required parameter

#             # Validate fields
#             if not all(
#                 [
#                     connection_name,
#                     host_locker_name,
#                     guest_locker_name,
#                     host_user_username,
#                     guest_user_username,
#                     document_name,
#                     sharing_type,
#                     xnode_id,
#                 ]
#             ):
#                 print("geting xnode",xnode_id)
#                 print("Missing required fields in request.")
#                 return JsonResponse(
#                     {
#                         "success": False,
#                         "error": "All fields including xnode_id are required",
#                     },
#                     status=400,
#                 )

#             # Fetch users and lockers
#             host_user = CustomUser.objects.get(username=host_user_username)
#             guest_user = CustomUser.objects.get(username=guest_user_username)
#             host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
#             guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)

#             # Fetch the connection and guest's resource
#             connection = Connection.objects.get(
#                 connection_name=connection_name,
#                 host_user=host_user,
#                 guest_user=guest_user,
#                 host_locker=host_locker,
#                 guest_locker=guest_locker,
#             )
#             guest_xnode = Xnode.objects.get(id=xnode_id)
#             print("Fetched guest Xnode:", guest_xnode)

#             # Extract resource details from guest Xnode
#             resource_id = guest_xnode.node_information["resource_id"]
#             guest_resource = Resource.objects.get(resource_id=resource_id)
#             print("Fetched guest resource:", guest_resource)

#             # Generate the file path for the host's copy of the resource
#             file_path = os.path.join(settings.MEDIA_ROOT, guest_resource.i_node_pointer)
#             file_name = f"{host_user.username}_{document_name}"
#             relative_path = os.path.join("documents", file_name)

#             # Save the file to the host's locker
#             new_file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
#             os.makedirs(os.path.dirname(new_file_path), exist_ok=True)
#             shutil.copy(file_path, new_file_path)
#             print("File copied to host's locker:", new_file_path)

#             # Create a new Resource for the host
#             new_resource = Resource.objects.create(
#                 document_name=document_name,
#                 i_node_pointer=relative_path,
#                 locker=host_locker,
#                 owner=host_user,
#                 type=guest_resource.type,  # Maintain visibility
#             )
#             print("Created new Resource:", new_resource)

#             # Get the number of pages in the PDF
#             length_of_pdf = 0
#             with open(new_file_path, "rb") as f:
#                 reader = PdfReader(f)
#                 length_of_pdf = len(reader.pages)

#             # Create a new Xnode in the host's locker based on sharing type and guest Xnode details
#             node_type = (
#                 Xnode.XnodeType.INODE
#                 if sharing_type.lower() == "transfer"
#                 else Xnode.XnodeType.VNODE
#             )
#             new_xnode = Xnode.objects.create(
#                 connection=connection,
#                 locker=host_locker,
#                 created_at=timezone.now(),
#                 validity_until=guest_xnode.validity_until,
#                 xnode_Type=node_type,
#                 node_information={
#                     "from_page": guest_xnode.node_information["from_page"],
#                     "to_page": guest_xnode.node_information["to_page"],
#                     "resource_id": new_resource.resource_id,
#                     "guest_xnode_id": (
#                         guest_xnode.id if node_type == Xnode.XnodeType.VNODE else None
#                     ),
#                 },
#             )
#             print("Created new Xnode in host locker:", new_xnode)

#             return JsonResponse(
#                 {
#                     "success": True,
#                     "message": "Resource downloaded and stored successfully",
#                     "resource_id": new_resource.resource_id,
#                     "xnode_id": new_xnode.id,
#                 },
#                 status=201,
#             )

#         except (
#             Connection.DoesNotExist,
#             Locker.DoesNotExist,
#             CustomUser.DoesNotExist,
#             Resource.DoesNotExist,
#             Xnode.DoesNotExist,
#         ) as e:
#             print("Error:", str(e))  # Log the error message for troubleshooting
#             return JsonResponse({"success": False, "error": str(e)}, status=404)
#         except Exception as e:
#             print("Unhandled exception occurred:", str(e))  # Log any unexpected errors
#             return JsonResponse({"success": False, "error": str(e)}, status=500)

#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )


