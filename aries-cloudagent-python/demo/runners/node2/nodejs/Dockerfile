# specify the node base image with your desired version node:<version>
FROM node:10
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD node alice.js
EXPOSE 3000
