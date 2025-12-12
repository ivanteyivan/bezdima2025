import uuid
import pytest


@pytest.mark.smoke
def test_list_disks(compute):
    resp = compute.list_disks()
    assert resp is not None


def test_get_disk_invalid(compute):
    with pytest.raises(Exception):
        compute.get_disk(str(uuid.uuid4()))


def test_create_delete_disk_skipped_reason():
    pytest.skip("Создание/удаление реальных ресурсов пропущено в CI; запустить вручную с валидными параметрами")

