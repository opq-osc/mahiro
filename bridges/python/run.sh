#!/bin/zsh

if [[ "$MAHIRO_PYTHON_URL" == "" ]]; then
    MAHIRO_PYTHON_URL=8099
fi
uvicorn main:app --reload --port $MAHIRO_PYTHON_URL --host 0.0.0.0
