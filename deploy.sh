#!/bin/bash
set -e
{

    git pull
    # yarn prisma:migrate:deploy
    # yarn prisma:generate
    yarn
    yarn build
    pm2 restart all
 
}
