#:sdk Aspire.AppHost.Sdk@13.3.0-preview.1.26172.1
#:package Aspire.Hosting.JavaScript@13.3.0-preview.1.26172.1

using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

static Uri ExternalServiceUri(string url) => new(url.TrimEnd('/') + "/");

var supabaseUrl = builder
	.AddParameterFromConfiguration("supabase-url", "NEXT_PUBLIC_SUPABASE_URL")
	.WithDescription("Supabase project URL, for example https://your-project.supabase.co/ . Use a trailing slash for the external service resource.");
var supabaseAnonKey = builder.AddParameterFromConfiguration("supabase-anon-key", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
var supabaseServiceRoleKey = builder.AddParameterFromConfiguration("supabase-service-role-key", "SUPABASE_SERVICE_ROLE_KEY", secret: true);
var openAiApiKey = builder.AddParameterFromConfiguration("openai-api-key", "OPENAI_API_KEY", secret: true);

var openai = builder.AddExternalService("openai", ExternalServiceUri("https://api.openai.com/v1"));
var supabase = builder.AddExternalService("supabase", supabaseUrl);

builder.AddJavaScriptApp("web", ".", "dev")
	.WithNpm()
	.WithHttpEndpoint(env: "PORT")
	.WithExternalHttpEndpoints()
	.WithEnvironment("HOSTNAME", "0.0.0.0")
	.WithEnvironment("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
	.WithEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey)
	.WithEnvironment("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey)
	.WithEnvironment("OPENAI_API_KEY", openAiApiKey)
	.WithReference(openai)
	.WithReference(supabase);

builder.Build().Run();
