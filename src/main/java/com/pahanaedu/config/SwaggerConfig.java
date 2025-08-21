package com.pahanaedu.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pahana Edu Bookshop API")
                        .version("1.0.0")
                        .description("Backend API for Pahana Edu bookshop management system")
                        .contact(new Contact()
                                .name("Pahana Edu")
                                .email("support@pahanaedu.com")))
                .addSecurityItem(new SecurityRequirement().addList("sessionAuth"))
                .components(new Components()
                        .addSecuritySchemes("sessionAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("basic")
                                        .description("Session-based authentication")));
    }
}
