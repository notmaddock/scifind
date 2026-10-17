import sys
import unittest

import uvicorn


def main() -> None:
    uvicorn.run("scifind.api.app:app", host="127.0.0.1", port=8000)


def run_tests() -> None:
    unittest.main(
        module=None,
        argv=["test", "discover", "-s", "tests", *sys.argv[1:]],
        verbosity=2,
    )
