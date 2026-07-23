using FluentValidation;
using Kontobuch.Application.Auth;
using Kontobuch.Application.Labels;
using Kontobuch.Application.Transactions;
using Microsoft.Extensions.DependencyInjection;

namespace Kontobuch.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ILabelService, LabelService>();
        services.AddScoped<ITransactionService, TransactionService>();

        return services;
    }
}
