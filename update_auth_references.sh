#!/bin/bash
sed -i 's/req.session.userId!/req.user!.id/g' server/routes.ts