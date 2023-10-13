#!/bin/bash

echo "installing prereqs"
# do some language specific preparation to the chaincode before packaging
CC_RUNTIME_LANGUAGE=golang

export CC_SRC_PATH=${HOME}/go/src/chaincode-go
# infoln "Vendoring Go dependencies at $CC_SRC_PATH"
pushd $CC_SRC_PATH
GO111MODULE=on go mod vendor
popd
successln "Finished vendoring Go dependencies"