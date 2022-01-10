import argparse
import os

import uvicorn

PRODUCTION_SERVER = {
    "args": ["py-backend.main:app"],
    "kwargs": {
        "host": "127.0.0.1",
        "port": 5000,
        "workers": 1,
    },
}

DEVELOPMENT_SERVER = {
    **PRODUCTION_SERVER,
    "kwargs": {
        **PRODUCTION_SERVER["kwargs"],
        "reload": True,
    },
}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build and deployment script for development and staging sites."
    )
    parser.add_argument(
        "-p",
        "--prod",
        action="store_true",
        default=False,
        help="boolean flag to run production server with API_KEY.\
            Defaults to False (runs development server).",
    )
    args = parser.parse_args()
    if args.prod:
        server = PRODUCTION_SERVER
    else:
        os.environ["DEVELOPMENT_MODE"] = "True"
        server = DEVELOPMENT_SERVER

    uvicorn.run(*server["args"], **server["kwargs"])
