package com.cabinet.medical.config;

import com.cabinet.medical.service.rmi.ConsultationRemoteServiceImpl;
import com.cabinet.medical.service.rmi.PatientRemoteServiceImpl;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Application configuration beans")
class ConfigurationCoverageTest {

    @Test
    @DisplayName("should create CORS source with configured origin and common HTTP methods")
    void shouldCreateCorsSourceWithConfiguredOriginAndCommonHttpMethods() {
        CorsConfig config = new CorsConfig();
        ReflectionTestUtils.setField(config, "allowedOrigins", "http://localhost:3000");

        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/api/v1/patients"));

        assertThat(cors).isNotNull();
        assertThat(cors.getAllowedOrigins()).containsExactly("http://localhost:3000");
        assertThat(cors.getAllowedMethods()).contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(cors.getAllowedHeaders()).containsExactly("*");
        assertThat(cors.getAllowCredentials()).isTrue();
    }

    @Test
    @DisplayName("should create ActiveMQ connection factory with configured credentials")
    void shouldCreateActiveMqConnectionFactoryWithConfiguredCredentials() {
        JmsConfig config = jmsConfig();

        ActiveMQConnectionFactory factory = config.connectionFactory();

        assertThat(factory.getBrokerURL()).isEqualTo("vm://localhost?broker.persistent=false");
        assertThat(factory).isNotNull();
    }

    @Test
    @DisplayName("should create JMS template and listener factory from connection factory")
    void shouldCreateJmsTemplateAndListenerFactoryFromConnectionFactory() {
        JmsConfig config = jmsConfig();

        JmsTemplate template = config.jmsTemplate();
        DefaultJmsListenerContainerFactory listenerFactory = config.jmsListenerContainerFactory();

        assertThat(template.getConnectionFactory()).isNotNull();
        assertThat(listenerFactory).isNotNull();
    }

    @Test
    @DisplayName("should create OpenAPI metadata with bearer security scheme")
    void shouldCreateOpenApiMetadataWithBearerSecurityScheme() {
        SwaggerConfig config = new SwaggerConfig();

        var openApi = config.openAPI();

        assertThat(openApi.getInfo().getTitle()).contains("Cabinet");
        assertThat(openApi.getInfo().getVersion()).isEqualTo("1.0.0");
        assertThat(openApi.getSecurity()).hasSize(1);
        assertThat(openApi.getComponents().getSecuritySchemes()).containsKey("Bearer Authentication");
        assertThat(openApi.getComponents().getSecuritySchemes().get("Bearer Authentication").getScheme()).isEqualTo("bearer");
    }

    @Test
    @DisplayName("should swallow RMI startup failure when registry port is invalid")
    void shouldSwallowRmiStartupFailureWhenRegistryPortIsInvalid() {
        RmiConfig config = new RmiConfig(
            Mockito.mock(PatientRemoteServiceImpl.class),
            Mockito.mock(ConsultationRemoteServiceImpl.class));
        ReflectionTestUtils.setField(config, "rmiPort", -1);

        config.startRmiRegistry();

        assertThat(config).isNotNull();
    }

    private JmsConfig jmsConfig() {
        JmsConfig config = new JmsConfig();
        ReflectionTestUtils.setField(config, "brokerUrl", "vm://localhost?broker.persistent=false");
        ReflectionTestUtils.setField(config, "user", "admin");
        ReflectionTestUtils.setField(config, "password", "admin");
        return config;
    }
}
