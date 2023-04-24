FROM node:14

RUN mkdir -p /usr/src/app

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

RUN npm install -g npm

#WORKDIR /usr/src/app

COPY package.json package-lock.json* /usr/src/app/
RUN npm install && npm cache clean --force
ENV PATH /opt/node_modules/.bin:$PATH
WORKDIR /usr/src/app
COPY . /usr/src/app

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
#COPY . .
RUN chmod +x ./wait-for.sh
#CMD sh -c './wait-for.sh localhost:3001 -- sequelize db:migrate && npm start'
CMD [ "npm", "start" ]
EXPOSE 3001
EXPOSE 3002

# COPY database-restore.sh /usr/src/database-restore.sh
# RUN chmod +x /usr/src/database-restore.sh
# CMD sh -c '/usr/src/database-restore.sh'
# entrypoint "/database-restore.sh"

