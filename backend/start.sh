#!/bin/bash

./wait-for.sh db:5432 bash -c "node models/schema.js"

npm start