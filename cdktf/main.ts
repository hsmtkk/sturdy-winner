import { Construct } from "constructs";
import { App, GcsBackend, TerraformStack } from "cdktf";
import * as google from '@cdktf/provider-google';
import { DataGoogleIamPolicy } from "@cdktf/provider-google/lib/data-google-iam-policy";

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

    const runner = new google.serviceAccount.ServiceAccount(this, 'runner', {
        accountId: 'runner',
    });

    new google.projectIamMember.ProjectIamMember(this, 'allowRunnerSecret', {
        member: `serviceAccount:${runner.email}`,
        project,
        role: 'roles/secretmanager.secretAccessor',
    });

    new google.artifactRegistryRepository.ArtifactRegistryRepository(this, 'registry', {
      format: 'docker',
      location: region,
      repositoryId: 'registry',
    });

    const cookieSecret = new google.secretManagerSecret.SecretManagerSecret(this, 'cookieSecret', {
        secretId: 'cookie-secret',
        replication: {
          automatic: true,
        },
    });

    const clientID = new google.secretManagerSecret.SecretManagerSecret(this, 'clientID', {
        secretId: 'client-id',
        replication: {
          automatic: true,
        },
      });
  
    const clientSecret = new google.secretManagerSecret.SecretManagerSecret(this, 'clientSecret', {
        secretId: 'client-secret',
        replication: {
          automatic: true,
        },
      });
  
    const webService = new google.cloudRunV2Service.CloudRunV2Service(this, 'web-service', {
      location: region,
      name: 'web-service',
      template: {
        containers: [{
          env: [
            {
                name: 'COOKIE_SECRET',
                valueSource: {
                    secretKeyRef: {
                        secret: cookieSecret.secretId,
                        version: '1',
                    },
                },
            },
            {
            name: 'CLIENT_ID',
            valueSource: {
                secretKeyRef: {
                    secret: clientID.secretId,
                    version: '1',
                },
            },
          },
          {
            name: 'CLIENT_SECRET',
            valueSource: {
                secretKeyRef: {
                    secret: clientSecret.secretId,
                    version: '1',
                },
            },
          },
          ],
          image: 'us-central1-docker.pkg.dev/sturdy-winner/registry/web:latest'          
        }],
        scaling: {
          minInstanceCount: 0,
          maxInstanceCount: 1,
        },
        serviceAccount: runner.email,
      },
    });

    const publicRun = new DataGoogleIamPolicy(this, 'publicRun', {
        binding: [{
            role: 'roles/run.invoker',
            members: ['allUsers'],
        }],
    });

    new google.cloudRunServiceIamPolicy.CloudRunServiceIamPolicy(this, 'publicPolicy', {
        location: region,
        policyData: publicRun.policyData,
        project,
        service: webService.name,
    });

  }
}

const app = new App();
new MyStack(app, "cdktf");
app.synth();
