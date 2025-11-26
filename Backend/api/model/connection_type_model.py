from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

from ..models import Locker, CustomUser

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

# class ConnectionType_V2(models.Model):
#     connection_type_id = models.AutoField(primary_key=True)
#     connection_type_name = models.CharField(max_length=50)
#     connection_description = models.TextField(blank=True, null=True)
#     owner_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='owner_user')
#     owner_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='owner_locker')
#     created_time = models.DateTimeField(auto_now_add=True)
#     validity_time = models.DateTimeField(default=default_validity_time)
#     post_conditions = models.JSONField(default=get_default_permissions)

#     class Meta:
#         db_table = "api_connectiontype"  # Explicitly set the table name

#     def __str__(self):
#         return self.connection_type_name

