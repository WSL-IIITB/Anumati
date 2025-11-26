from django.utils import timezone
from datetime import timedelta
from ..model.xnode_model import Xnode_V2

def get_defalut_validity():
       return timezone.now() + timedelta(days=14)


### Node Lock Checker Class start ###
class NodeLockChecker:
    """Class to check if a node is locked before resource exchange,transfer locking, collateral locking, and confer locking."""

    def __init__(self, node):
        self.node = node

    def is_locked(self):
        """Checks if the node is locked based on type and ownership for transfer."""
        node_type = self.node.xnode_Type
        print(f"Node Type is: {node_type}")

        # SNODE and INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True


    def is_transfer_locked(self):
        """Checks if the node is locked based on type and ownership for transfer."""
        node_type = self.node.xnode_Type
        print(f"Node Type is: {node_type}")

        # VNODE is **never locked** for transfer
        if node_type == "VNODE":
            return False

        # SNODE and INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True

    def is_collateral_locked(self):
        """Checks if a node is locked for collateral purposes."""
        node_type = self.node.xnode_Type
        print(f"Checking collateral lock for Node Type: {node_type}")

        # VNODE **cannot** be used as collateral
        if node_type == "VNODE":
            return True  # Always locked for collateral

        # SNODE and INODE: Locked for collateral if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True

    def is_confer_locked(self):
        """Checks if a node is locked for confer purposes."""
        node_type = self.node.xnode_Type
        print(f"Checking confer lock for Node Type: {node_type}")

        # VNODE is ** locked** for confer
        if node_type == "VNODE":
            return True  

        # INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True


 ### This is the end of the NodeLockChecker class definition.


def compute_terms_status(terms_value):
    count_T = 0
    count_F = 0
    count_R = 0
    filled = 0
    empty = 0

    if terms_value:
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

        total_terms = count_T + count_F + count_R
        if total_terms > 0:
            empty = total_terms - filled
    else:
        total_terms = 0
        empty = 0
        filled = 0

    return {
        "count_T": count_T,
        "count_F": count_F,
        "count_R": count_R,
        "empty": empty,
        "filled": filled,
    }


def append_xnode_provenance(
    xnode_instance,
    connection_id,
    from_locker,
    to_locker,
    from_user,
    to_user,
    type_of_share,
    xnode_post_conditions,
    reverse
):
    """
    Appends a full snapshot of the Xnode_V2 instance to the provenance stack.
    """
    xnode = Xnode_V2.objects.get(id=xnode_instance.id)
    # Serialize the full model instance as a dictionary
    # serialized_data = json.loads(serializers.serialize("json", [xnode_instance]))[0]["fields"]

    new_entry = {
        "connection": connection_id,
        "from_locker": from_locker,
        "to_locker": to_locker,
        "from_user": from_user,
        "to_user": to_user,
        "type_of_share": type_of_share,
        "xnode_id": xnode_instance.id,
        "xnode_post_conditions": xnode_post_conditions,
        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
        "reverse": reverse
    }

    if not isinstance(xnode.provenance_stack, list):
        xnode.provenance_stack = []

    xnode.provenance_stack.append(new_entry)
    xnode.save(update_fields=["provenance_stack"])


def remove_xnode_provenance_entry(
    xnode_instance,
    connection_id,
    from_locker,
    to_locker,
    from_user,
    to_user,
    xnode_id,
    type_of_share
):
    xnode = Xnode_V2.objects.get(id=xnode_instance)
    xnode.refresh_from_db()
    # Ensure the provenance_stack is a list
    if not isinstance(xnode.provenance_stack, list):
        # print(error)
        return  # or raise error if needed

    # Define match criteria
    def is_matching_entry(entry):
        print("Parameters:", connection_id, from_locker, to_locker, from_user, to_user, type_of_share, xnode_id)
        print("Checking entry:", entry)

        try:
            match = (
                int(entry.get("connection")) == int(connection_id) and
                int(entry.get("from_locker")) == int(from_locker) and
                int(entry.get("to_locker")) == int(to_locker) and
                int(entry.get("from_user")) == int(from_user) and
                int(entry.get("to_user")) == int(to_user) and
                entry.get("type_of_share") == type_of_share and
                int(entry.get("xnode_id")) == int(xnode_id)
            )

            print("Match result:", match)
            return match

        except Exception as e:
            print(f"Error in matching: {e}")
            return False


    original_len = len(xnode.provenance_stack)
    xnode.provenance_stack = [
        entry for entry in xnode.provenance_stack
        if not is_matching_entry(entry)
    ]
    print(f"Removed {original_len - len(xnode.provenance_stack)} entries")

    xnode.save(update_fields=["provenance_stack"])
    xnode.refresh_from_db()
    print("Updated provenance_stack:", xnode.provenance_stack)

