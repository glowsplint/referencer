import os
import subprocess
import typing


def build_frontend():
    return "yarn build"


def build_docker_image():
    return "docker build -t referencer ."


def run_docker_container():
    return "docker run -dp 5000:5000 referencer"


def clean_up_containers():
    return "docker container prune -f"


def clean_up_images():
    return "docker image prune -f"


frontend_build_pipeline = [build_frontend]

docker_build_and_run_pipeline = [
    build_docker_image,
    run_docker_container,
    clean_up_containers,
    clean_up_images,
]


def execute_pipeline(pipeline: list[str], f: typing.TextIO):
    for func in pipeline:
        command = func()
        print("-" * 80)
        print(f"Running: {command}")
        subprocess.run(
            command,
            shell=True,
            text=True,
            check=True,
            stdin=f,
            stdout=f,
        )


if __name__ == "__main__":
    with open("output.txt", "w") as f:
        # Build frontend
        os.chdir("frontend")
        execute_pipeline(pipeline=frontend_build_pipeline, f=f)

        # Build Docker container, and run
        os.chdir("..")
        execute_pipeline(pipeline=docker_build_and_run_pipeline, f=f)
