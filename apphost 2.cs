#:sdk Aspire.AppHost.Sdk@13.3.0-preview.1.26172.1
#:package Aspire.Hosting.JavaScript@13.3.0-preview.1.26172.1

LoadDotEnvIfPresent(".env", overwriteExisting: false);
LoadDotEnvIfPresent(".env.local", overwriteExisting: true);

var configuredOpenAiEndpoint = Environment.GetEnvironmentVariable("OPENAI_ENDPOINT");
if (string.IsNullOrWhiteSpace(configuredOpenAiEndpoint))
{
	configuredOpenAiEndpoint = "https://api.openai.com/v1/";
}
else if (!configuredOpenAiEndpoint.EndsWith("/", StringComparison.Ordinal))
{
	configuredOpenAiEndpoint += "/";
}

Environment.SetEnvironmentVariable("OPENAI_ENDPOINT", configuredOpenAiEndpoint);

var builder = DistributedApplication.CreateBuilder(args);

var openAiEndpoint = builder.AddParameterFromConfiguration("openai-endpoint", "OPENAI_ENDPOINT");
var openAiApiKey = builder.AddParameterFromConfiguration("openai-api-key", "OPENAI_API_KEY", secret: true);

var supabaseUrl = builder.AddParameterFromConfiguration("supabase-url", "NEXT_PUBLIC_SUPABASE_URL");
var supabaseAnonKey = builder.AddParameterFromConfiguration("supabase-anon-key", "NEXT_PUBLIC_SUPABASE_ANON_KEY", secret: true);
var supabaseServiceRoleKey = builder.AddParameterFromConfiguration("supabase-service-role-key", "SUPABASE_SERVICE_ROLE_KEY", secret: true);

var openAi = builder.AddExternalService("openai", openAiEndpoint);
var supabase = builder.AddExternalService("supabase", supabaseUrl);

builder.AddJavaScriptApp("web", ".")
	.WithHttpEndpoint(port: 3000, env: "PORT")
	.WithExternalHttpEndpoints()
	.WithReference(openAi)
	.WithReference(supabase)
	.WithEnvironment("OPENAI_ENDPOINT", openAiEndpoint)
	.WithEnvironment("OPENAI_API_KEY", openAiApiKey)
	.WithEnvironment("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
	.WithEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey)
	.WithEnvironment("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);

builder.Build().Run();

static void LoadDotEnvIfPresent(string relativePath, bool overwriteExisting)
{
	var filePath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);
	if (!File.Exists(filePath))
	{
		return;
	}

	foreach (var rawLine in File.ReadAllLines(filePath))
	{
		var line = rawLine.Trim();
		if (line.Length == 0 || line.StartsWith("#", StringComparison.Ordinal))
		{
			continue;
		}

		var separatorIndex = line.IndexOf('=');
		if (separatorIndex <= 0)
		{
			continue;
		}

		var key = line[..separatorIndex].Trim();
		if (key.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
		{
			key = key[7..].Trim();
		}

		if (string.IsNullOrWhiteSpace(key))
		{
			continue;
		}

		var value = line[(separatorIndex + 1)..].Trim();
		if ((value.StartsWith('"') && value.EndsWith('"')) || (value.StartsWith('\'') && value.EndsWith('\'')))
		{
			value = value[1..^1];
		}

		if (overwriteExisting || string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
		{
			Environment.SetEnvironmentVariable(key, value);
		}
	}
}
