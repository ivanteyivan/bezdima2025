import pytest


@pytest.mark.smoke
def test_list_flavors(compute):
    resp = compute.list_flavors()
    assert resp is not None
    assert isinstance(resp, dict) or isinstance(resp, list)


def test_get_flavor_invalid(compute):
    with pytest.raises(Exception):
        compute.get_flavor("invalid-id")

