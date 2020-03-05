/* eslint-disable @typescript-eslint/camelcase */
import { commitParser } from '@minddocdev/mou-release-action/commits';
import { setOutput } from '@actions/core';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'theowner',
      repo: 'therepo',
    },
  },
}));
jest.mock('@actions/core');

const author = {
  login: 'darioblanco',
  html_url: 'https://authorurl',
};

const html_url = 'https://commiturl';
const sha = '62ec8ea713fdf14e4abaef3d7d5138194dec49ce';

describe('commit', () => {
  const compareCommitsResponse = {
    data: {
      commits: [
        {
          author,
          html_url,
          sha,
          commit: { message: 'feat:super feature' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'fix: My fix' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'docs(context): document everything' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'style: awesome style' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'refactor(context): one does not simply refactor' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'test: Tests are good' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'chore: somebody has to keep things going' },
        },
        {
          author,
          html_url,
          sha,
          commit: { message: 'uncategorized commit' },
        },
      ],
    },
  };
  const compareCommits = jest.fn(() => compareCommitsResponse);

  beforeEach(() => compareCommits.mockClear());

  test('render commits diff for each category', async () => {
    const github = { repos: { compareCommits } };
    const {
      changes, tasks, pullRequests,
    } = await commitParser(github as any, 'v1.0.0', 'v1.1.1', 'JIRA-');
    expect(setOutput).toBeCalledWith(
      'changes',
      JSON.stringify(compareCommitsResponse.data.commits.map(commit => commit.sha)), // 8 commits
    );
    expect(setOutput).toBeCalledWith('tasks', '[]');
    expect(setOutput).toBeCalledWith('pull_requests', '[]');
    expect(changes).toMatchSnapshot();
    expect(tasks).toBe('');
    expect(pullRequests).toBe('');
  });

  test('render commits diff when scope is required', async () => {
    const compareCommits = jest.fn(() => compareCommitsResponse);
    const github = { repos: { compareCommits } };
    const {
      changes, tasks, pullRequests,
    } = await commitParser(github as any, 'v1.0.0', 'v1.1.1', 'JIRA-', undefined, 'context');
    expect(setOutput).toBeCalledWith(
      'changes',
      '["62ec8ea713fdf14e4abaef3d7d5138194dec49ce","62ec8ea713fdf14e4abaef3d7d5138194dec49ce"]',
    );
    expect(setOutput).toBeCalledWith('tasks', '[]');
    expect(setOutput).toBeCalledWith('pull_requests', '[]');
    expect(changes).toMatchSnapshot();
    expect(tasks).toBe('');
    expect(pullRequests).toBe('');
  });

  test('render github squashed commits for scope auth', async () => {
    const commitMessage = '[JIRA-2772] Title of my PR (#1716)\n\n\
* feat(auth): set login endpoint controller\n\n\
* test(auth): add integration test for login endpoint\n\n\
* fix(auth): set secure and http only options\n\n\
This is the body of the previous commit\n\n\
And this is the footer\n\n\
* (auth): Set values for staging and production\n\n\
* Address comment from PR\n\n\
This is the body of the previous commit\n\n\
* feat(auth): set expiration of the cookie to the amount of time of the token\n\n\
* fix(auth): remove joi validation since it does not accept localhost';
    const compareSquashedCommitsResponse = {
      data: {
        commits: [
          {
            author,
            html_url,
            sha,
            commit: {
              message: commitMessage,
            },
          },
        ],
      },
    };
    const compareCommits = jest.fn(() => compareSquashedCommitsResponse);
    const github = { repos: { compareCommits } };
    const {
      changes, tasks, pullRequests,
    } = await commitParser(github as any, 'v1.0.0', 'v1.1.1', 'JIRA-', undefined, 'auth');
    expect(setOutput).toBeCalledWith(
      'changes',
      JSON.stringify(commitMessage.split('* ').slice(2).map(() => sha)), // 6 commits
    );
    expect(setOutput).toBeCalledWith('tasks', '["JIRA-2772"]');
    expect(setOutput).toBeCalledWith('pull_requests', '["1716"]');
    expect(changes).toMatchSnapshot();
    expect(tasks).toBe('- [JIRA-2772](https://theowner.atlassian.net/browse/JIRA-2772)\n');
    expect(pullRequests).toBe('- [#1716](https://github.com/theowner/therepo/pull/1716)\n');
  });
});