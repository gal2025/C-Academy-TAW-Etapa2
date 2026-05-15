# Usar a imagem oficial do Node.js como base

FROM node:alpine

# Definir a pasta de trabalho dentro do container

WORKDIR /usr/src/app

# Copiar o package.json e o package-lock.json para o diretório de trabalho

COPY package*.json ./

# Instalar as dependências

RUN npm install

# Copiar o resto da aplicação para a pasta de trabalho

COPY . .

# Expor a porta que a API vai usar

EXPOSE 3000

# Comando para iniciar a API

CMD [ "npm", "start" ]