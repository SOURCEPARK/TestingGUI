#!/bin/bash

./wait-for.sh db:5432 bash -c "node models/schema.js && node seed/seed.js"

npm start