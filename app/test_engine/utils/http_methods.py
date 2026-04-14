import requests
import json
import logging
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Http_methods:

    @staticmethod
    def _build_headers(auth_type, auth_data):
        headers = {}

        if auth_type == 2:  # Bearer
            headers["Authorization"] = f"Bearer {auth_data.get('token')}"

        elif auth_type == 3:  # API key
            headers["X-API-KEY"] = auth_data.get("api_key")

        return headers

    @staticmethod
    def _build_auth(auth_type, auth_data):
        if auth_type == 1:  # Basic
            return (auth_data.get("username"), auth_data.get("password"))
        return None

    @staticmethod
    def get(base_url, endpoint, auth_type, auth_data, arguments=None):

        url = base_url.rstrip("/") + endpoint

        if arguments:
            query = "&".join(f"{k}={v}" for k, v in arguments.items())
            url += f"?{query}"

        try:
            response = requests.get(
                url=url,
                headers=Http_methods._build_headers(auth_type, auth_data),
                auth=Http_methods._build_auth(auth_type, auth_data),
                verify=False
            )

            Http_methods._log_request(url, None, response)

            return response

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"GET request failed: {e}")

    @staticmethod
    def post(base_url, endpoint, body, auth_type, auth_data):

        url = base_url.rstrip("/") + endpoint

        try:
            response = requests.post(
                url=url,
                json=body or {},
                headers=Http_methods._build_headers(auth_type, auth_data),
                auth=Http_methods._build_auth(auth_type, auth_data),
                verify=False
            )

            Http_methods._log_request(url, body, response)

            return response

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"POST request failed: {e}")

    @staticmethod
    def _log_request(url, body, response):
        logging.debug("")
        logging.debug(f"Request URL: {url}")

        if body:
            logging.debug("Request body:")
            logging.debug(json.dumps(body, indent=2, ensure_ascii=False))

        logging.debug("Response:")

        try:
            logging.debug(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except Exception:
            logging.debug("Response is not JSON")

        logging.debug("")