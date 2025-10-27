# # syntax=docker/dockerfile:1

# # Comments are provided throughout this file to help you get started.
# # If you need more help, visit the Dockerfile reference guide at
# # https://docs.docker.com/go/dockerfile-reference/

# # Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

# ARG NODE_VERSION=22.19.0

# ################################################################################
# # Use node image for base image for all stages.
# FROM node:${NODE_VERSION}-alpine as base

# # Set working directory for all build stages.
# WORKDIR /usr/src/app


# ################################################################################
# # Create a stage for installing production dependecies.
# FROM base as deps

# # Download dependencies as a separate step to take advantage of Docker's caching.
# # Leverage a cache mount to /root/.npm to speed up subsequent builds.
# # Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# # into this layer.
# RUN --mount=type=bind,source=package.json,target=package.json \
#     --mount=type=bind,source=package-lock.json,target=package-lock.json \
#     --mount=type=cache,target=/root/.npm \
#     npm ci --omit=dev

# ################################################################################
# # Create a stage for building the application.
# FROM deps as build

# # Download additional development dependencies before building, as some projects require
# # "devDependencies" to be installed to build. If you don't need this, remove this step.
# RUN --mount=type=bind,source=package.json,target=package.json \
#     --mount=type=bind,source=package-lock.json,target=package-lock.json \
#     --mount=type=cache,target=/root/.npm \
#     npm ci

# # Copy the rest of the source files into the image.
# COPY . .
# # Run the build script.
# RUN npm run build

# ################################################################################
# # Create a new stage to run the application with minimal runtime dependencies
# # where the necessary files are copied from the build stage.
# FROM base as final

# # Use production node environment by default.
# ENV NODE_ENV production

# # Run the application as a non-root user.
# USER node

# # Copy package.json so that package manager commands can be used.
# COPY package.json .

# # Copy the production dependencies from the deps stage and also
# # the built application from the build stage into the image.
# COPY --from=deps /usr/src/app/node_modules ./node_modules
# COPY --from=build /usr/src/app/dist ./dist


# # Expose the port that the application listens on.
# EXPOSE 3000

# # Run the application.
# CMD npm run start:prod

# syntax=docker/dockerfile:1.6
ARG NODE_VERSION=22.19.0-alpine
ARG APP_NAME=trip

############################
# 1) Install all dev deps (for Nx build)
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
# copy only what Nx needs to resolve and install
COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci

############################
# 2) Build the selected app with Nx
FROM node:${NODE_VERSION} AS builder
WORKDIR /repo
COPY . .
COPY --from=deps /repo/node_modules ./node_modules
ARG APP_NAME
# production build (adjust configuration if needed)
RUN npx nx build $APP_NAME --configuration=production

############################
# 3) Install only production deps for runtime
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

############################
# 4) Final minimal runtime image
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
WORKDIR /app

# copy production node_modules and the built app output
COPY --from=prod-deps /repo/node_modules ./node_modules
ARG APP_NAME
COPY --from=builder   /repo/dist/apps/${APP_NAME} ./dist

# Copy proto files for gRPC (needed at runtime)
COPY --from=builder /repo/libs/shared/src/lib/protos ./libs/shared/src/lib/protos

# expose whatever your app listens on (env-driven in main.ts is best)
EXPOSE 3000

# start the built Nest app
CMD ["node", "dist/main.js"]


