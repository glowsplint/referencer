FROM python:3.11
WORKDIR /code
COPY ./Pipfile /code/Pipfile
COPY ./Pipfile.lock /code/Pipfile.lock
RUN pip install pipenv
RUN pipenv install --system --deploy --ignore-pipfile
COPY ./frontend/dist /code/frontend/dist
COPY ./backend /code/backend
EXPOSE 5000
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT