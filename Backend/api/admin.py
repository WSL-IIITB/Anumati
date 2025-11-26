from django.contrib import admin
from api.models import CustomUser, Connection, ConnectionType, GlobalConnectionTypeTemplate, ConnectionTerms, ConnectionTypeRegulationLinkTable, Resource, Locker, Notification

# Register your models here.

admin.site.register(CustomUser)
admin.site.register(Connection)
admin.site.register(ConnectionType)
admin.site.register(ConnectionTerms)
admin.site.register(GlobalConnectionTypeTemplate)
admin.site.register(ConnectionTypeRegulationLinkTable)
admin.site.register(Resource)
admin.site.register(Locker)
admin.site.register(Notification)