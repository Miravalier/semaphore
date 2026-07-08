import uvicorn
from .main import app


if __name__ == '__main__':
    uvicorn.run(app, port=80, host="0.0.0.0", proxy_headers=True, forwarded_allow_ips="*")
