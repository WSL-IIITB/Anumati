from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

from .views import show_terms, get_notifications

from .view import resource_management_view, resource_sharing_view, connections_view


urlpatterns = [
    path("",view=views.home,name="home"),
    path("dpi-directory/", views.dpi_directory, name="dpi-directory"),
    path("upload-resource_v2/", resource_management_view.upload_resource, name="upload_resource"),
    path("create-subset-resource/", resource_management_view.create_subset_resource, name="create_subset_resource"),
    path("create-locker/", views.create_locker, name="create-locker"),
    path("get-public-resources/", views.get_public_resources, name="get-public-resources"),
    path("get-connection-type/", views.get_connection_type, name="get-connection-type"),
    path("check-download-status/<int:xnode_id>/<int:connection_id>/", connections_view.check_download_status, name="check-download-status"),
    path("update_connection_status/",connections_view.update_connection_status_if_expired,name="update_connection_status"),
    path("update_connection_status_tolive/",connections_view.update_connection_status_tolive,name="update_connection_status_tolive"),
    path("update_connection_status_if_expired_onlogin/",connections_view.update_connection_status_if_expired_onlogin,name="update_connection_status_if_expired_onlogin"),
    path("update_xnode_v2_status/",resource_management_view.xnode_v2_status,name="update_xnode_v2_status"),

    path("get-lockers-user/", views.get_lockers_user, name="get-lockers-user"),
    path("get-other-connection-types/",views.get_other_connection_types,name="get-other-connection-types", ),
    path("connection_types/",views.get_connection_type_by_user_by_locker,name="get_connection_types",),
    path("all_connection_types/",views.get_connection_type_by_user,name="get_all_connection_types",),
    path("create-new-connection/",views.create_new_connection,name="create_new_connection",),
    path("login-user/", views.login_view, name="login"),
    path("show_terms/", show_terms, name="show_terms"),
    path("show_terms_reverse/", view=views.show_terms_reverse, name="show_terms_reverse"),
    path("give-consent/", views.give_consent, name="give_consent"),

    path("revoke-consent/",view=resource_sharing_view.revoke_consent,name="revoke_consent"),
    path("revert-consent/",view=resource_sharing_view.revert_consent,name="revert_consent"),
    path("reject_revert_consent/",view=resource_sharing_view.reject_revert_consent,name="reject_revert_consent"),

    path("get-connections-user-locker/",views.get_connection_by_user_by_locker,name="get-connections-user-locker",),
    path("get-outgoing-connections-by-user/",views.get_outgoing_connections_by_user,name="get-outgoing-connections-by-user",),

    #path("get-connections-user/",views.get_connection_by_user,name="get-connections-user"),
    path("get-all-connections/", views.get_all_connections, name="get-all-connections"),
    path("get-resources-user-locker/",views.get_resource_by_user_by_locker,name="get-resources-user-locker",),
    path("signup-user/", views.signup_user, name="signup_user"),
    path("download_resource_v2/",resource_management_view.download_resource,name="download_resource_v2",),
    path("create-connection-type-and-terms/",views.create_connection_type_and_connection_terms,name="create-connection-type-and-terms",),
    path("freeze-unfreeze-locker/", views.freeze_or_unfreeze_locker, name="freeze_locker"),
    path("freeze-unfreeze-connection/",views.freeze_or_unfreeze_connection,name="freeze_connection",),
    path("get-guest-user-connection/",views.get_guest_user_connection,name="get_guest_user_connection",),
    path("get-guest-user-connection-id/",views.get_guest_user_connection_id,name="get_guest_user_connection_id",),
    #path(
    #    "update-connection-terms/",
     #   views.update_connection_terms,
      #  name="update_connection_terms",
    #),
    path("update_connection_terms_v2/",connections_view.update_connection_terms,name="update_connection_terms",),
    path('get-notifications/', get_notifications, name='get-notifications'),
    path("get-terms-status/", views.get_terms_status, name="get_terms_status"),
    path("get-terms-status-reverse/", view=views.get_terms_status_reverse, name="get_terms_status_reverse"),
    path("get-connection-details/",views.get_connection_details,name="get_connection_details",),
    path("get-connection-details-v2/",connections_view.get_connection_details,name="get_connection_details",),
    path("check-conditions/",connections_view.check_conditions,name="check_conditions",),
    path("create-admin/", views.create_admin, name="create_admin"),
    path("create-moderator/", views.create_moderator, name="create_moderator"),
    path("remove-admin/", views.remove_admin, name="remove_admin"),
    path("remove-moderator/", views.remove_moderator, name="remove_moderator"),
    path("get-connection-terms-for-global-template/",view=views.get_All_Connection_Terms_For_Global_Connection_Type_Template,name="get_Connection_Terms_For_Global_Template",),
    path("add-global-template/",view=views.create_Global_Connection_Type_Template,name="create_global_template",),
    path("connect-type-to-template/",view=views.connect_Global_Connection_Type_Template_And_Connection_Type,name="connect_type_to_template",),
    path("get-template-or-templates/",view=views.get_Global_Connection_Type,name="get_template_or_templates",),
    path("get-link-regulation-for-connection-type/",view=views.get_Connection_Link_Regulation_For_Connection_Type,name="get_link_for_connection_type",),
    path("create-global-terms/",view=views.create_Global_Connection_Terms,name="create_global_terms",),
    path("update-delete-locker/", views.delete_Update_Locker, name="update_delete_locker"),
    path("get-terms-value/", view=views.get_terms_for_user, name="get-terms-value"),
    path("get-outgoing-connections/",views.get_outgoing_connections_to_locker,name="get_outgoing_connections_to_locker",),
    path("edit-delete-connectiontype/",view=views.edit_delete_connectiontype_details,name="edit-connection",),
    path("update-connectiontermsonly/",view=views.update_connection_termsONLY,name="update-connectiontermsonly",),
  
    path('mark-notification-read/', view=views.mark_notifications_read, name='mark-notification-read'),
    path("get-consent/", view=views.get_consent_status, name="get-consent"),
    path("get-terms-by-conntype/",views.get_terms_by_connection_type,name="get-terms-by-conntype",),
  
    path("reshare-check/",view=views.reshare_Allowed_Or_Not,name="reshare_check"),
    path("access-resource-v2/",view=resource_management_view.access_Resource_API,name="access_resource"),
    path("get_all_xnodes_for_locker_v2/",view=connections_view.get_All_Xnodes,name='get_all_xnodes_for_locker'),
    path("update-extra-data-v2/", resource_management_view.update_extra_data, name="update_extra_data"),
    path("get-extra-data/", view=views.get_extra_data, name="get_extra_data"),
    path("get_user_resources_by_connection_type_2/", connections_view.get_user_resources_by_connection_type, name="get_user_resources_by_connection_type"),
    path("get_outgoing_connection_xnode_details_v2/", connections_view.get_outgoing_connection_xnode_details, name="get_outgoing_connection_xnode_details"),
    path("get-outgoing-connections-user/",views.get_outgoing_connections_user,name="get_outgoing_connections_user",),
    # path(
    #     "revoke-host/",
    #     view=views.revoke_host,
    #     name="revoke_host"
    # ),
    path("update_inode_v2/",view=resource_management_view.update_Xnode_Inode,name="update_inode"),
    path("get_total_pages_v2/", resource_management_view.get_total_pages_in_document, name="get-total-pages"),
    path("global-connection-template-put-get-delete/",view=views.global_Connection_CRUD,name="global_connection_template_put_get_delete"),
    path('access-res-submitted-v2/', resource_management_view.access_res_submitted, name='access_res_submitted'),
    path('consent-artefact-view-edit/',resource_management_view.consent_artifact_view_update,name='consent_artefact_view_update'),
    path('edit-delete-resource-v2/', resource_management_view.delete_Update_Resource, name='edit_delete_resource'),
    path('download-resource/', views.download_resource, name='download_resource'),
    path('collateral_resource_v2/', resource_sharing_view.collateral_resource, name='collateral_resource'),
    path('collateral_resource_reverse_v2/', resource_sharing_view.collateral_resource_reverse, name='collateral-resource-reverse'),
    path('close_connection_consent/', views.close_connection_consent, name='close_connection_consent'),
    path('close_connection_guest/', views.close_connection_guest, name='close_connection_guest'),
    path('close_connection_host/', views.close_connection_host, name='close_connection_host'),
    path('get_connections_by_user/',views.get_connections_by_user,name="get_connections_by_user"),
    path("transfer_resource_v2/", connections_view.transfer_resource, name="transfer_resource_v2"),
    path("transfer_resource_reverse_v2/", connections_view.transfer_resource_reverse, name="transfer_resource_reverse_v2"),

    path('share_confer_resource_v2/',resource_sharing_view.share_confer_resource_v2,name='share_confer_resource_v2'),
    path('share_resource_approve_v2/',resource_sharing_view.share_resource_approve_v2,name='share_resource_approve_v2'),
    path('confer_resource_approve_v2/',resource_sharing_view.confer_resource_approve_v2,name='confer_resource_approve_v2'),

    path('share_confer_resource_reverse_v2/',resource_sharing_view.share_confer_resource_reverse_v2,name='share_confer_resource_reverse_v2'),
    path('share_resource_approve_reverse_v2/',resource_sharing_view.share_resource_approve_reverse_v2,name='share_resource_approve_reverse_v2'),
    path('confer_resource_approve_reverse_v2/',resource_sharing_view.confer_resource_approve_reverse_v2,name='confer_resource_approve_reverse_v2'),

    path("reject_shared_resource_v2/", connections_view.reject_shared_resource, name="reject_shared_resource_v2"),
    path("all_incoming_connection_resource/", connections_view.get_incoming_connection_resource_shared_by_host_to_guest, name="all_incoming_connection_resource/"),
    path("all_outgoing_connection_resource/", connections_view.get_outgoing_connection_resource_shared_by_guest_to_host, name="all_outgoing_connection_resource/"),

    path("stats/", views.get_status, name="get_stats")


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
