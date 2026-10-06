FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5180
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5180/health', timeout=8)"
CMD ["python", "app.py"]
