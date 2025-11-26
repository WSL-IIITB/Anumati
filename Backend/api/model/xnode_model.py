from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta

from ..models import Connection, Locker, CustomUser

def get_default_post_conditions():
    return {
        "creator_conditions" : {
            "download": True,
            "share": True,
            "confer": True,
            "transfer": True,
            "collateral": True,
            "subset": True        
        },
        "download": True,
        "share": True,
        "confer": True,
        "transfer": True,
        "collateral": True,
        "subset": True
    }

def get_default_is_locked():
    return {
        "download": False,
        "share": False,
        "confer": False,
        "transfer": False,
        "collateral": False,
        "subset": False
    }

class Xnode_V2(models.Model):
    class XnodeType(models.TextChoices):
        INODE = "INODE", "Inode"
        VNODE = "VNODE", "Vnode"
        SNODE = "SNODE", "Snode"
    Xnode_V2_STATUS_CHOICES = [     #new structure
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]    
    id = models.AutoField(primary_key=True)
    connection = models.ForeignKey(to=Connection, null=True, on_delete=models.CASCADE)
    locker = models.ForeignKey(to=Locker, null=True, default=None, on_delete=models.CASCADE)
    creator = models.IntegerField()
    created_at = models.DateTimeField()
    validity_until = models.DateTimeField()
    xnode_Type = models.CharField(_("Xnode Type"), max_length=50, choices=XnodeType.choices, default=XnodeType.INODE)
    node_information = models.JSONField(default=dict)
    provenance_stack = models.JSONField(default=list)
    post_conditions = models.JSONField(default=get_default_post_conditions)
    snode_list = models.JSONField(default=list)
    vnode_list = models.JSONField(default=list)
    is_locked = models.JSONField(default=get_default_is_locked)
    status = models.CharField(
        max_length=20,
        choices=Xnode_V2_STATUS_CHOICES,
        default='active'
    )
    #new feilds 
    host_revert_status = models.IntegerField(default=0)   # 0: none, 1: approved, 2: rejected
    guest_revert_status = models.IntegerField(default=0)  # 0: none, 1: approved, 2: rejected
    reverted = models.BooleanField(default=False)         # True after both approved
    #revert_reason = models.TextField(null=True, blank=True)

        
    def __str__(self) -> str:
        return str(self.id)
    """
    post_conditions: {
        "creator_conditions" : {
            "download": True,
            "share": True,
            "confer": True,
            "transfer": True,
            "collateral": True,
            "subset": True        
        },
        "download": True,
        "share": True,
        "confer": True,
        "transfer": True,
        "collateral": True,
        "subset": True
    }
    provenance_stack : {
        connection:
        from_user:
        to_user:
        from_locker:
        to_locker:
        type_of_share:
        reverse:
        xnode_id:
    }
    node_info: INODE {
        resource_id,
        method_name,
        method_params,
        resource_link,
        resource_name,
        primary_owner,
        current_owner,
        remarks,->purpose
    }
    node_info: VNODE {
        link,
        current_owner,
        remarks,->purpose
    }
    node_info: SNODE {
        inode_or_snode_id,
        method_name,
        method_params,
        resource_id,
        primary_owner,
        current_owner,
        reverse,
        remarks,->purpose
    }

    Confer => I have the inode/vnode and the other person has the snode with the pointer to the inode/vnode.
    Collateral => I have the snode, with the pointer to the inode/vnode, and the other person has the inode/vnode.
    """


# class CollateralRevertRequest(models.Model):
#     xnode = models.ForeignKey(
#         Xnode_V2,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='revert_requests'
#     )
#     original_requested_xnode = models.ForeignKey(
#         Xnode_V2,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='original_revert_requests'
#     )
#     xnode_id_snapshot = models.IntegerField(null=True, blank=True)  # New field
#     original_requested_xnode_id_snapshot = models.IntegerField(null=True, blank=True)  # New field

#     connection = models.ForeignKey(
#         Connection,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True
#     )
#     host_revert = models.BooleanField(default=False)
#     guest_revert = models.BooleanField(default=False)
#     reverted = models.BooleanField(default=False)
#     revert_reason = models.TextField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)


