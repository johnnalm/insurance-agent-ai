# Usa una imagen base de Python oficial
# Asegúrate de que la versión de Python sea compatible con tus dependencias (ej. 3.11)
FROM python:3.11-slim

# Establece variables de entorno para evitar que Python escriba archivos .pyc y use buffers
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala dependencias del sistema si fueran necesarias (ej. para algunas librerías C)
# We still need git for other potential pip git installs, but not for htmldiff specifically now.
RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 git && rm -rf /var/lib/apt/lists/*

# Copia el archivo de requerimientos primero para aprovechar el caché de Docker
COPY requirements.txt .

# Instala las dependencias de Python
# --no-cache-dir para reducir el tamaño de la imagen
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación al directorio de trabajo
COPY ./app /app/app

# Expone el puerto en el que correrá Uvicorn dentro del contenedor
# Nota: Esto no publica el puerto al host, eso se hace en docker-compose.yml
EXPOSE 8001

# Comando por defecto para correr la aplicación usando Uvicorn
# Escucha en 0.0.0.0 para ser accesible desde fuera del contenedor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
