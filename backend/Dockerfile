FROM python:3.13
ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /work/requirements.txt
RUN pip install -r /work/requirements.txt


COPY ./src /work/app
WORKDIR /work
CMD ["python3", "-m", "app"]
