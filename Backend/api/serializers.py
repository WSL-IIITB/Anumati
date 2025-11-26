
from rest_framework import serializers
from .models import (
    CustomUser,
    Locker,
    Connection,
    Resource,
    ConnectionType,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
)
from .model.xnode_model import Xnode_V2


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["user_id", "username", "description", "user_type"]


class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = ["locker_id", "name", "description", "user", "is_frozen"]


class ConnectionSerializer(serializers.ModelSerializer):
    host_user = UserSerializer(many=False, read_only=True)
    guest_user = UserSerializer(many=False, read_only=True)
    host_locker = LockerSerializer(many=False, read_only=True)
    guest_locker = LockerSerializer(many=False, read_only=True)

    #this changes made to display  the connection type name
    connection_type_name = serializers.CharField(source="connection_type.connection_type_name", read_only=True)

    class Meta:
        model = Connection
        fields = [
            "connection_id",
            "connection_name",
            "connection_type",
            "connection_type_name",#display the connection type name
            "host_locker",
            "guest_locker",
            "host_user",
            "guest_user",
            "connection_description",
            "requester_consent",
            "revoke_host",
            "revoke_guest",
            "validity_time",
            "created_time",
            "is_frozen",
            "terms_value",
            "terms_value_reverse",
            "resources",
            "consent_given",
            "connection_status",
            "close_guest",
            "close_host",
            
        ]
        # fields = [
        #     "connection_id",
        #     "connection_name",
        #     "connection_type",
        #     "host_locker",
        #     "guest_locker",
        #     "host_user",
        #     "guest_user",
        #     "connection_description",
        #     "requester_consent",
        #     "revoke_host",
        #     "revoke_guest",
        #     "validity_time",
        #     "created_time",
        #     "is_frozen",
        #     "terms_value",
        #     "resources",
        #     "consent_given"
        # ]


class ResourceSerializer(serializers.ModelSerializer):
    connections = ConnectionSerializer(many=True, read_only=True)
    upload_time = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M:%S")
    validity_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = Resource
        fields = [
            "resource_id",
            "document_name",
            "upload_time",
            "validity_time",
            "i_node_pointer",
            "locker",
            "version",
            "connections",
            "owner",
            "type",
        ]
        # fields = [
        #     "resource_id",
        #     "document_name",
        #     "i_node_pointer",
        #     "locker",
        #     "version",
        #     "connections",
        #     "owner",
        #     "type",
        # ]


class ConnectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionType
        fields = [
            "connection_type_id",
            "connection_type_name",
            "connection_description",
            "owner_user",
            "owner_locker",
            "validity_time",
            "created_time",
        ]
        # fields = [
        #     "connection_type_id",
        #     "connection_type_name",
        #     "connection_description",
        #     "owner_user",
        #     "owner_locker",
        #     "validity_time",
        #     "created_time",
        # ]


class ConnectionTermsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTerms
        fields = [
            "terms_id",
            "conn_type",
            "global_conn_type",
            "modality",
            "data_element_name",
            "data_type",
            "sharing_type",
            "purpose",
            "description",
            "host_permissions",
            "from_Type",
            "to_Type"
        ]
        # fields = [
        #     "terms_id",
        #     "conn_type",
        #     "global_conn_type",
        #     "modality",
        #     "data_element_name",
        #     "data_type",
        #     "sharing_type",
        #     "purpose",
        #     "description",
        #     "host_permissions",
        # ]


class ConnectionFilterSerializer(serializers.ModelSerializer):
    host_user = UserSerializer(many=False, read_only=True)
    guest_user = UserSerializer(many=False, read_only=True)
    host_locker = LockerSerializer(many=False, read_only=True)
    guest_locker = LockerSerializer(many=False, read_only=True)

    class Meta:
        model = Connection
        fields = [
            "connection_id",
            "connection_name",
            "connection_type",
            "host_locker",
            "guest_locker",
            "host_user",
            "guest_user",
            "validity_time",
            "created_time",
            "is_frozen",
            "connection_status"
        ]


class GlobalConnectionTypeTemplatePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConnectionTypeTemplate
        exclude = ["global_connection_type_template_id"]
        depth = 1


class GlobalConnectionTypeTemplateGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConnectionTypeTemplate
        fields = "__all__"
        depth = 1


class ConnectionTypeRegulationLinkTablePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTypeRegulationLinkTable
        exclude = ["link_Id"]
        depth = 1


class ConnectionTypeRegulationLinkTableGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTypeRegulationLinkTable
        fields = "__all__"
        depth = 1
class XnodeV2Serializer(serializers.ModelSerializer):
    connection = ConnectionSerializer(read_only=True)
    locker = LockerSerializer(read_only=True)
    primary_owner_username = serializers.SerializerMethodField()
    current_owner_username = serializers.SerializerMethodField()
    creator_username = serializers.SerializerMethodField()
    creator_details = serializers.SerializerMethodField()
    current_owner_details = serializers.SerializerMethodField()

    class Meta:
        model = Xnode_V2
        fields = [
            "id",
            "connection",
            "locker",
            "created_at",
            "validity_until",
            "xnode_Type",
            "node_information",
            "provenance_stack",
            "post_conditions",
            "snode_list",
            "vnode_list",
            "primary_owner_username",
            "current_owner_username",
            "creator",
            "creator_username",
            "creator_details",
            "current_owner_details",
            "is_locked",
            "status",
            "host_revert_status",
            "guest_revert_status",
            "reverted"
        ]
        read_only_fields = ["id", "created_at"]

    def validate_node_information(self, value):
        """
        Custom validation for node_information based on xnode_Type.
        """
        xnode_type = self.initial_data.get("xnode_Type")
        required_fields = {
            "INODE": [
                "resource_id",
                "method_name",
                "method_params",
                "resource_link",
                "resource_name",
                "primary_owner",
                "current_owner",
            ],
            "VNODE": [
                "link",
                "current_owner",
            ],
            "SNODE": [
                "inode_or_snode_id",
                "method_name",
                "method_params",
                "resource_id",
                "primary_owner",
                "current_owner",
                "reverse",
            ],
        }
        if xnode_type and required_fields.get(xnode_type):
            missing_fields = [field for field in required_fields[xnode_type] if field not in value]
            if missing_fields:
                raise serializers.ValidationError(
                    f"Missing required fields for xnode_Type {xnode_type}: {', '.join(missing_fields)}"
                )
        return value

    def get_primary_owner_username(self, obj):
        primary_owner_id = obj.node_information.get("primary_owner")
        if primary_owner_id and isinstance(primary_owner_id, int):
            try:
                user = CustomUser.objects.get(user_id=primary_owner_id)
                return user.username
            except CustomUser.DoesNotExist:
                return None
        return None

    def get_current_owner_username(self, obj):
        current_owner_id = obj.node_information.get("current_owner")
        if current_owner_id and isinstance(current_owner_id, int):
            try:
                user = CustomUser.objects.get(user_id=current_owner_id)
                return user.username
            except CustomUser.DoesNotExist:
                return None
        return None

    def get_creator_username(self, obj):
        try:
            user = CustomUser.objects.get(user_id=obj.creator)
            return user.username
        except CustomUser.DoesNotExist:
            return None
        
    def get_creator_details(self, obj):
        try:
            user = CustomUser.objects.get(user_id=obj.creator)
            return {
            "user_id": user.user_id,
            "username": user.username,
            "description": user.description,
            "user_type": user.user_type
        }
        except CustomUser.DoesNotExist:
            return None
        
    def get_current_owner_details(self, obj):
        current_owner_id = obj.node_information.get("current_owner")
        if current_owner_id and isinstance(current_owner_id, int):
            try:
                user = CustomUser.objects.get(user_id=current_owner_id)
                return {
                    "user_id": user.user_id,
                    "username": user.username,
                    "description": user.description,
                    "user_type": user.user_type
                }
            except CustomUser.DoesNotExist:
                return None
        return None
