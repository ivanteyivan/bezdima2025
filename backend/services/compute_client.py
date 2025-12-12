from typing import Any, Dict, Optional

from .cloud_auth import CloudRuAuthenticator, CloudRuComputeClient


class ComputeAPI:
    """
    Высокоуровневый клиент для Evolution Compute Public API v3.
    Оперирует сущностями VMs / Disks / Flavors.

    Примеры тел запросов (без хардкода значений):
      # POST /vms
      {"name": "...", "flavor_id": "...", "image_id": "...", "ssh_key_id": "...", "network_id": "..."}
      # PATCH /vms/{id}
      {"name": "new-name"}
      # POST /vms/{id}/change-status
      {"status": "start" | "stop" | "reboot"}
      # POST /disks
      {"name": "...", "size": 10, "type": "hdd|ssd"}
      # POST /disks/{id}/attach
      {"vm_id": "..."}
    """

    def __init__(
        self,
        authenticator: Optional[CloudRuAuthenticator] = None,
        project_id: Optional[str] = None,
        base_url: str = "https://compute.api.cloud.ru",
    ) -> None:
        self.auth = authenticator or CloudRuAuthenticator()
        self.client = CloudRuComputeClient(authenticator=self.auth, base_url=base_url, project_id=project_id)

    # VMs
    def list_vms(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.client.get("/vms", params=params).json()

    def get_vm(self, vm_id: str) -> Dict[str, Any]:
        return self.client.get(f"/vms/{vm_id}").json()

    def create_vm(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self.client.post("/vms", json=body).json()

    def update_vm(self, vm_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self.client.patch(f"/vms/{vm_id}", json=body).json()

    def change_vm_status(self, vm_id: str, status: str) -> Dict[str, Any]:
        return self.client.post(f"/vms/{vm_id}/change-status", json={"status": status}).json()

    def delete_vm(self, vm_id: str) -> Dict[str, Any]:
        return self.client.delete(f"/vms/{vm_id}").json()

    # Disks
    def list_disks(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.client.get("/disks", params=params).json()

    def get_disk(self, disk_id: str) -> Dict[str, Any]:
        return self.client.get(f"/disks/{disk_id}").json()

    def create_disk(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self.client.post("/disks", json=body).json()

    def update_disk(self, disk_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self.client.patch(f"/disks/{disk_id}", json=body).json()

    def attach_disk(self, disk_id: str, vm_id: str) -> Dict[str, Any]:
        return self.client.post(f"/disks/{disk_id}/attach", json={"vm_id": vm_id}).json()

    def detach_disk(self, disk_id: str) -> Dict[str, Any]:
        return self.client.post(f"/disks/{disk_id}/detach").json()

    def delete_disk(self, disk_id: str) -> Dict[str, Any]:
        return self.client.delete(f"/disks/{disk_id}").json()

    # Flavors
    def list_flavors(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.client.get("/flavors", params=params).json()

    def get_flavor(self, flavor_id: str) -> Dict[str, Any]:
        return self.client.get(f"/flavors/{flavor_id}").json()

