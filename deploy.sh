#!/bin/bash
s3cmd del --recursive --force s3://manacher-viz/app/
s3cmd put --recursive app s3://manacher-viz/
s3cmd put index.html s3://manacher-viz/index.html