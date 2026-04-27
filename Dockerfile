# Use the official Microsoft .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the projekt file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the remaining files and build the app
COPY . ./
RUN dotnet publish -c Release -o out

# Use the official Microsoft .NET ASP.NET image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Expose the port the app listens on
EXPOSE 8080

# Define the entry point for the application
ENTRYPOINT ["dotnet", "AdwiseAiPlatform.dll"]
