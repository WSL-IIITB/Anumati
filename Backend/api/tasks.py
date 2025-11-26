# This file maintains all the cron jobs that have to performed in the project.
from django.utils import timezone
from api.models import Connection

# CRON job - Iterate through all the rows in the corresponding database table and check if the validity has expired. If yes, change the ownership of the resource if the host has approved and then delete it (and log it) otherwise, just delete it (and log it).
def check_connections_valid_until():
    now = timezone.now()
    expired_connections = Connection.objects.filter(validity_time__lt=now)
    count, _ = expired_connections.delete()
    print(f"Deleted {count} expired connections.")
