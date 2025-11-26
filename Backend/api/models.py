from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from django.utils.timezone import now
from datetime import timedelta
from django.utils.translation import gettext_lazy 

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not username:
            raise ValueError('The username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(
                'Superuser must be assigned to is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(
                'Superuser must be assigned to is_superuser=True.')
        
        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    SYS_ADMIN = 'system_admin'
    MODERATOR = 'moderator'
    USER = 'user'
    TYPE_CHOICES = [(SYS_ADMIN, 'System Admin'), (MODERATOR, 'Moderator'), (USER, 'User')]
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=200, default="")
    user_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'

    def __str__(self):
        return self.username

class Locker(models.Model):
    locker_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=30)
    description = models.TextField(blank=True, null=True, default=None)  # Allow description to be optional
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # user will be the one logged in
    is_frozen = models.BooleanField(default=False)


    def __str__(self):
        return self.name


def default_validity_time():
    return timezone.now() + timedelta(days=7)


def get_default_permissions():
    return {
        "download": False,
        "share": False,
        "confer": False,
        "transfer": False,
        "collateral": False,
        "subset":False
    }

class ConnectionType(models.Model):

    connection_type_id = models.AutoField(primary_key=True)
    # connection_type_id = models.PositiveIntegerField(primary_key=True, default=lambda: generate_global_id('connection_type'), editable=False)
    connection_type_name = models.CharField(max_length=50)
    connection_description = models.TextField(blank=True, null=True)
    owner_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='connectiontype_owner_user')
    owner_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='connectiontype_owner_locker')
    created_time = models.DateTimeField(auto_now_add=True)
    validity_time = models.DateTimeField(default=default_validity_time)
    post_conditions  = models.JSONField(default=get_default_permissions)

    def __str__(self):
        return self.connection_type_name


class Connection(models.Model):
    CONNECTION_STATUS_CHOICES = [
        ('established', 'Established'),     #new structure
        ('live', 'Live'),
        ('closed', 'Closed'),
        ('revoked', 'Revoked'),
    ]

    connection_id = models.AutoField(primary_key=True)
    connection_name = models.CharField(max_length=100)
    connection_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, related_name='connection_type')
    host_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='host_locker')
    guest_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='guest_locker')
    host_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='host_user')
    guest_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='guest_user')
    connection_description = models.TextField(blank=True, null=True)
    requester_consent = models.BooleanField(default=False)
    revoke_host = models.BooleanField(default=False)
    revoke_guest = models.BooleanField(default=False)
    is_frozen = models.BooleanField(default=False)
    resources = models.JSONField(default=dict)
    terms_value = models.JSONField(default=dict)
    terms_value_reverse = models.JSONField(default=dict)
    validity_time = models.DateTimeField(default=default_validity_time)
    created_time = models.DateTimeField(auto_now_add=True)
    consent_given = models.DateTimeField(null=True,blank=True)
    # New field replacing `closed`
    connection_status = models.CharField(
        max_length=20,
        choices=CONNECTION_STATUS_CHOICES,
        default='established'
    )
 
    close_host = models.BooleanField(default=False)  # Host approval for closure
    close_guest = models.BooleanField(default=False)  # Guest approval for closure 

    def __str__(self):
        return self.connection_name
    
    # def save(self, *args, **kwargs):
    #     # Generate connection_name based on connection_type, guest_user, and host_user
    #     self.connection_name = f"{self.connection_type.connection_type_name}-{self.host_user.username}:{self.guest_user.username}"
        
    #     # Call the original save() method to save the instance
    #     super(Connection, self).save(*args, **kwargs)


class Resource(models.Model):
    PUBLIC = 'public'
    PRIVATE = 'private'
    TYPE_CHOICES = [(PUBLIC, 'Public'), (PRIVATE, 'Private')]
    resource_id = models.AutoField(primary_key=True)
    document_name = models.CharField(max_length=50)
    i_node_pointer = models.CharField(max_length=255, default='none')
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE)
    version = models.CharField(max_length=20, default='none')
    connections = models.ManyToManyField(Connection, related_name='connection')
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    type = models.CharField(max_length=7, choices=TYPE_CHOICES, default=PRIVATE)
    upload_time = models.DateTimeField(auto_now=True)  # Automatically set when resource is created
    validity_time = models.DateTimeField(null=True, blank=True)  # Set by the user during creation or update

    def __str__(self):
        return self.document_name

class GlobalConnectionTypeTemplate(models.Model):
    global_connection_type_template_id = models.AutoField(primary_key=True)
    global_connection_type_name = models.CharField(max_length=200, unique=True)
    global_connection_type_description = models.CharField(max_length=200)
    
    # Globaltype field with two options: 'template', 'policy'
    TEMPLATE = 'template'
    POLICY = 'policy'
    GLOBAL_TYPE_CHOICES = [
        (TEMPLATE, 'template'),
        (POLICY, 'policy'),
    ]
    globaltype = models.CharField(
        max_length=10,
        choices=GLOBAL_TYPE_CHOICES,
        default=TEMPLATE,  # Optional default
    )
    
    # Domain field with options: 'health', 'education', 'finance', 'personal data'
    HEALTH = 'health'
    EDUCATION = 'education'
    FINANCE = 'finance'
    PERSONAL_DATA = 'personal data'
    DOMAIN_CHOICES = [
        (HEALTH, 'health'),
        (EDUCATION, 'education'),
        (FINANCE, 'finance'),
        (PERSONAL_DATA, 'personal Data'),
    ]
    domain = models.CharField(
        max_length=20,
        choices=DOMAIN_CHOICES,
        default=PERSONAL_DATA,  # Optional default
    )

    def __str__(self) -> str:
        return self.global_connection_type_name

class ConnectionTypeRegulationLinkTable(models.Model):
    link_id = models.AutoField(primary_key=True)
    connection_type_id = models.ForeignKey(to=ConnectionType, on_delete=models.CASCADE, null=True)
    global_connection_template_id = models.ForeignKey(to=GlobalConnectionTypeTemplate, on_delete=models.CASCADE, null=True) #change here

class Notification(models.Model):
    connection = models.ForeignKey(Connection, on_delete=models.CASCADE)
    host_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='host_notifications')
    guest_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='guest_notifications')
    is_read = models.BooleanField(default=False)  # To track if the notification has been viewed
    # Adding host and guest locker fields
    host_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='host_locker_notifications')
    guest_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='guest_locker_notifications')
    created_at = models.DateTimeField(auto_now_add=True)
    connection_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, null=True, blank=True)  # Add ForeignKey to ConnectionType
    message = models.TextField(null=True, blank=True)
    # New fields for clickable/contextual notifications
    notification_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'connection_created', 'resource_accessed'
    target_type = models.CharField(max_length=50, blank=True, null=True)        # e.g., 'locker', 'user', 'connection', 'resource'
    target_id = models.CharField(max_length=100, blank=True, null=True)         # e.g., locker_id, user_id, etc.
    extra_data = models.JSONField(default=dict, blank=True)                     # e.g., {"locker_name": "...", "locker_description": "..."}

    def __str__(self):
        return f"Notification from {self.guest_user.username} to {self.host_user.username} for connection {self.connection.connection_name}"

class ConnectionTerms(models.Model):
    class TermFromTo(models.TextChoices):
        HOST = 'HOST', 'Host'
        GUEST = 'GUEST', 'Guest'
    MODALITY_CHOICES = [('obligatory', 'Obligatory'), ('permissive', 'Permissive'), ('forbidden', 'Forbidden')]
    terms_id = models.AutoField(primary_key=True)
    conn_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, null=True)
    global_conn_type = models.ForeignKey(GlobalConnectionTypeTemplate, on_delete=models.CASCADE, null=True) #change here
    modality = models.CharField(max_length=50, choices=MODALITY_CHOICES, default='obligatory')
    data_element_name = models.CharField(max_length=50)
    host_permissions = models.JSONField(default=list)
    data_type = models.CharField(max_length=50)
    sharing_type = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    purpose=models.TextField(max_length=100)
    from_Type = models.CharField(max_length=50, choices=TermFromTo.choices, default=TermFromTo.GUEST)
    to_Type = models.CharField(max_length=50, choices=TermFromTo.choices, default=TermFromTo.HOST)
    def _str_(self):
        return f"{self.modality} - {self.data_element_name}"
    