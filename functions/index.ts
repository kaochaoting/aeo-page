export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = '/aeo';
  return Response.redirect(url.toString(), 302);
};
