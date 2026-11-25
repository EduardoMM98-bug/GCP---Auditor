
from typing import Literal

from pydantic import BaseModel, Field


class PermisoFirewall(BaseModel):

    ip_protocol: str = Field(alias="IPProtocol")

    ports: list[str] = Field(default_factory=list)


class ReglaFirewall(BaseModel):

    name: str

    direction: Literal["INGRESS", "EGRESS"]

    source_ranges: list[str] = Field(alias="sourceRanges")

    allowed: list[PermisoFirewall]

    disabled: bool = False
