import os
import json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

CATALOG = [
    {
        "emergent_product_id": "theme_pack",
        "name": "Sanctuary Theme Pack",
        "tax_code": "txcd_10302000",
        "prices": [
            {"lookup_key": "theme_pack", "amount": 499, "currency": "usd"},
        ],
    }
]


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(
        name=entry["name"],
        tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]},
    )


def main():
    account = stripe.Account.retrieve()
    print("sandbox country:", account.get("country"))
    for entry in CATALOG:
        product = get_or_create_product(entry)
        for p in entry["prices"]:
            existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
            if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
                stripe.Price.modify(existing[0].id, active=False)
                existing = []
            if not existing:
                kwargs = dict(
                    product=product.id,
                    unit_amount=p["amount"],
                    currency=p["currency"],
                    lookup_key=p["lookup_key"],
                    transfer_lookup_key=True,
                )
                if p.get("interval"):
                    kwargs["recurring"] = {"interval": p["interval"]}
                price = stripe.Price.create(**kwargs)
                print("created price", price.id, p["lookup_key"])
            else:
                print("price exists", existing[0].id, p["lookup_key"])
    print(json.dumps({"country": account.get("country")}))


if __name__ == "__main__":
    main()
