output "estatehub_api_url" {
  description = "EstateHub API Gateway URL"
  value       = aws_apigatewayv2_stage.estatehub_default.invoke_url
}