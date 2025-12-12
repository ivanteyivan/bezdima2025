#!/usr/bin/env python
import sys
import os

# Add the parent directory to path so we can import src
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("src.adk_api:app", host="127.0.0.1", port=9000, reload=False)
