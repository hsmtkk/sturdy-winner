import { Construct } from "constructs";
import { App, GcsBackend, TerraformStack } from "cdktf";
import * as google from '@cdktf/provider-google';

const project = 'sturdy-winner';
const region = 'us-central1';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new google.provider.GoogleProvider(this, 'google', {
      project,
      region,
    });

    new GcsBackend(this, {
      bucket: `backend-${project}`
    });

    new google.artifactRegistryRepository.ArtifactRegistryRepository(this, 'registry', {
      format: 'docker',
      location: region,
      repositoryId: 'registry',
    });

    new google.cloudRunV2Service.CloudRunV2Service(this, 'web-service', {
      location: region,
      name: 'web-service',
      template: {
        containers: [{
          image: 'us-central1-docker.pkg.dev/sturdy-winner/registry/web:latest'
        }],
        scaling: {
          minInstanceCount: 0,
          maxInstanceCount: 1,
        },
      },
    });

    new google.cloudRunV2Service.CloudRunV2Service(this, 'oauth2-service', {
      location: region,
      name: 'oauth2-service',
      template: {
        containers: [{
          image: 'quay.io/oauth2-proxy/oauth2-proxy:latest'
        }],
        scaling: {
          minInstanceCount: 0,
          maxInstanceCount: 1,
        },
      },
    });

  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
