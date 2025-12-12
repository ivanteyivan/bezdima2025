import uuid
import pytest


@pytest.mark.smoke
def test_list_vms(compute):
    resp = compute.list_vms()
    assert resp is not None


def test_get_vm_invalid(compute):
    with pytest.raises(Exception):
        compute.get_vm(str(uuid.uuid4()))


def test_vm_change_status_invalid(compute):
    with pytest.raises(Exception):
        compute.change_vm_status(str(uuid.uuid4()), "start")


def test_vm_create_delete_skipped_reason():
    pytest.skip("Создание/удаление реальных VM пропущено в CI; запустить вручную с валидными параметрами")

