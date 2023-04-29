
set -e

cd ../mahiro

current_dir=$(pwd)
mahiro_db_path=$current_dir/mahiro.db
mahiro_start_file=$current_dir/index.ts

if [ ! -f $mahiro_start_file ]; then
  echo "index.ts not found"
  exit 1
fi
if [ ! -f $mahiro_db_path ]; then
  touch $mahiro_db_path
fi

docker run -d \
  -p 8086:8086 \
  -p 8098:8098 \
  -p 8099:8099 \
  --name mahiro \
  -v $mahiro_db_path:/app/server/mahiro.db \
  -v $mahiro_start_file:/app/server/index.ts \
  mahiro:v1
