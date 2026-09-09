"""
Concrete adapter for public internship REST APIs (DataSource.Type.API).

The adapter pulls listings from a JSON endpoint configured on the
``DataSource`` (``base_url`` plus optional per-source ``config`` such
as an API key, headers, or the JSON path that holds the listings), maps
external fields (``title``, ``company_name``, ``description``,
``skills``, ``application_url``, ``deadline``) onto the internal
Task 1.5 schema, and respects rate limits with exponential-backoff
retry (Section 2.8).
"""

from .base import (
    BaseAdapter,
    RawListing,
    normalize_raw_to_schema,
)
from .http import HTTPFetcher


class APIAdapter(BaseAdapter):
    """
    Adapter for a single HTTP/JSON internship source.

    The ``config`` JSON on the ``DataSource`` may override defaults::

        {
            "results_path": "jobs",           # dotted path to the list
            "headers": {"Authorization": "..."},
            "params": {"category": "software-dev"},
            "timeout_seconds": 15,
            "max_retries": 3,                 # additional attempts
            "backoff_base_seconds": 1.0,      # exponential base
            "min_request_interval": 0.5,      # pacing between calls
            "field_map": {"title": "name"},   # external field overrides
        }

    Retry behaviour (Section 2.8) is delegated to ``HTTPFetcher``:
    HTTP ``429`` and any ``5xx`` are retried with exponential backoff,
    honouring the ``Retry-After`` header when present.
    """

    def __init__(self, source):
        self.source = source
        self._fetcher = HTTPFetcher(source.config or {})

    # ------------------------------------------------------------------
    # base contract
    # ------------------------------------------------------------------

    def fetch(self) -> list[RawListing]:
        """
        Call the configured API and map each JSON job onto a
        ``RawListing`` dictionary.
        """
        url = self.source.base_url
        if not url:
            raise ValueError(
                "APIAdapter requires a base_url on the DataSource."
            )

        config = self.source.config or {}
        response = self._fetcher.get(url)
        payload = response.json()
        items = self._extract_listings(payload, config)

        return [self._map_listing(item, config) for item in items]

    def normalize(self, raw: RawListing) -> dict:
        """
        Map one raw API listing onto the internal Task 1.5 schema.
        """
        return normalize_raw_to_schema(raw)

    # ------------------------------------------------------------------
    # payload handling
    # ------------------------------------------------------------------

    def _extract_listings(self, payload, config):
        """
        Locate the listing list inside a JSON payload. Defaults to the
        payload itself, then to common envelope keys, then to the
        configured dotted ``results_path``.
        """
        path = config.get("results_path")

        if not path:
            if isinstance(payload, list):
                return payload
            for key in ("jobs", "results", "data", "listings"):
                if isinstance(payload.get(key), list):
                    return payload[key]
            raise ValueError(
                "API endpoint did not return a list of listings."
            )

        current = payload

        for key in str(path).split("."):
            if not isinstance(current, dict) or key not in current:
                raise ValueError(
                    f"results_path '{path}' not found in payload."
                )
            current = current[key]

        if not isinstance(current, list):
            raise ValueError(
                f"results_path '{path}' did not resolve to a list."
            )

        return current

    def _map_listing(self, item, config) -> RawListing:
        """
        Map one source-specific JSON object onto the ``RawListing``
        shape. External field names (``title``, ``company_name``,
        ``description``, ``skills``, ``application_url``, ``deadline``)
        are resolved first; per-source aliases can be provided through
        the ``config`` ``"field_map"`` dictionary.
        """
        field_map = config.get("field_map") or {}

        def external(internal_key, *fallbacks):
            names = (
                [field_map.get(internal_key, internal_key)]
                + list(fallbacks)
            )
            for name in names:
                value = item.get(name)
                if value not in (None, ""):
                    return value
            return None

        application_url = external(
            "application_url", "url", "apply_url"
        )
        source_url = (
            external("source_url", "url") or application_url
        )
        external_id = (
            external("external_id", "id")
            or application_url
            or external("title")
        )

        return {
            "external_id": str(external_id or ""),
            "title": external("title") or "",
            "organization_name": external(
                "organization_name", "company_name", "company"
            ) or "",
            "description": external("description", "summary") or "",
            "category": external("category") or "",
            "country": external("country") or "",
            "city": external("city") or "",
            "location_text": external(
                "location_text", "location"
            ) or "",
            "internship_type": (
                external("internship_type") or "onsite"
            ),
            "work_type": (
                external("work_type") or "full_time"
            ),
            "compensation_type": (
                external("compensation_type") or "unknown"
            ),
            "minimum_compensation": external(
                "minimum_compensation"
            ),
            "maximum_compensation": external(
                "maximum_compensation"
            ),
            "compensation_currency": external(
                "compensation_currency"
            ) or "",
            "compensation_period": external(
                "compensation_period"
            ) or "",
            "required_skills": external(
                "required_skills", "skills"
            ) or [],
            "preferred_skills": external("preferred_skills") or [],
            "duration_min_weeks": external("duration_min_weeks"),
            "duration_max_weeks": external("duration_max_weeks"),
            "application_url": application_url or "",
            "source_url": source_url or "",
            "posted_at": external(
                "posted_at", "posted_date", "posted"
            ),
            "application_deadline": external(
                "application_deadline", "deadline", "due"
            ),
        }