import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from scifind.api.app import app


class DocumentIntakeTests(unittest.TestCase):
    def test_upload_attention_is_all_you_need(self):
        paper = Path(__file__).with_name("Attention Is All You Need.pdf")

        with TestClient(app) as client, paper.open("rb") as pdf:
            response = client.post(
                "/api/documents",
                files={"file": (paper.name, pdf, "application/pdf")},
            )

        self.assertEqual(response.status_code, 200, response.text)
        document = response.json()
        self.assertEqual(document["filename"], paper.name)
        self.assertEqual(document["format"], "pdf")
        self.assertTrue(document["segments"])
        first_page = document["segments"][0]
        self.assertEqual(first_page["page_number"], 1)
        self.assertIn(
            "Attention Is All You Need", " ".join(first_page["text"].split())
        )
