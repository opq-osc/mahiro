#!/bin/zsh

if [[ "$MAHIRO_PYTHON_PORT" == "" ]]; then
    MAHIRO_PYTHON_PORT=8099
fi
uvicorn example.src.main:app --reload --port $MAHIRO_PYTHON_PORT --host 0.0.0.0
